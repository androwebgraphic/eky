// POST /api/dogs/:id/adopt-cancel
const nodemailer = require('nodemailer');
const { heicBufferToJpeg } = require('../utils/heicToJpeg.js');
const { getOrientationTransform } = require('../utils/orientation.js');
const { getOrCreateConversation, sendMessage } = require('./chatController.js');
const ChatConversation = require('../models/chatConversationModel.js');
const ChatMessage = require('../models/chatMessageModel.js');
const { io } = require('../socket.js');
const Dog = require('../models/dogModel.js');
const User = require('../models/userModel.js');
// Removed Cloudinary imports
const cancelAdoption = async (req, res) => {
  try {
    const dog = await Dog.findById(req.params.id).populate('user', 'email name');
    if (!dog) return res.status(404).json({ message: 'Dog not found' });
    if (dog.adoptionStatus !== 'pending' || !dog.adoptionQueue) {
      return res.status(400).json({ message: 'No pending adoption for this dog' });
    }
    const userId = req.user._id.toString();
    const adopterId = dog.adoptionQueue.adopter?.toString();
    if (userId !== adopterId) {
      return res.status(403).json({ message: 'Only the adopter can cancel adoption' });
    }
    // Save reason if provided
    const reason = req.body?.reason || '';
    // Reset adoption fields
    dog.adoptionStatus = 'available';
    dog.adoptionQueue = undefined;
    await dog.save();
    console.log(`[CANCEL ADOPTION] Dog ${dog._id} cancelled by adopter ${adopterId}. Status now: ${dog.adoptionStatus}`);
    // Send email to both users (owner and adopter)
    // Send chat message to both users
try {
  const ownerId = dog.user?._id ? dog.user._id.toString() : dog.user.toString();
  const adopterIdStr = adopterId;
  let convo = await ChatConversation.findOne({ participants: { $all: [ownerId, adopterIdStr] } });
  if (convo) {
    const cancelMsg = `Adoption for dog ${dog.name} has been cancelled by the adopter.${reason ? '\nReason: ' + reason : ''}`;
    await ChatMessage.create({ conversationId: convo._id, sender: adopterIdStr, recipient: ownerId, message: cancelMsg });
    await ChatMessage.create({ conversationId: convo._id, sender: null, recipient: null, message: `Adoption for dog ${dog.name} has been cancelled.` });
    await ChatConversation.findByIdAndUpdate(convo._id, { updatedAt: Date.now() });
    if (io) {
      io.to(ownerId).emit('receiveMessage', { conversationId: convo._id, sender: null, message: `Adoption for dog ${dog.name} has been cancelled.` });
      io.to(adopterIdStr).emit('receiveMessage', { conversationId: convo._id, sender: null, message: `Adoption for dog ${dog.name} has been cancelled.` });
    }
  }
} catch (msgErr) {
  console.warn('Failed to send cancellation chat message:', msgErr);
}
    try {
      const transporter = nodemailer.createTransport({
        sendmail: true,
        newline: 'unix',
        path: '/usr/sbin/sendmail'
      });
      const ownerEmail = dog.user?.email;
      const adopterEmail = req.user.email;
      const subject = `Adoption cancelled for dog: ${dog.name}`;
      const text = `Adoption for dog ${dog.name} has been cancelled by the adopter.${reason ? '\nReason: ' + reason : ''}`;
      if (ownerEmail) {
        await transporter.sendMail({ from: 'noreply@eky.local', to: ownerEmail, subject, text });
      }
      if (adopterEmail) {
        await transporter.sendMail({ from: 'noreply@eky.local', to: adopterEmail, subject, text });
      }
    } catch (mailErr) {
      console.warn('Failed to send cancellation email:', mailErr);
    }
    // Return updated pending adoptions for debugging
    const userIdForQuery = req.user._id;
    const dogs = await Dog.find({
      $or: [
        { user: userIdForQuery, adoptionStatus: 'pending' },
        { 'adoptionQueue.adopter': userIdForQuery, adoptionStatus: 'pending' }
      ]
    });
    res.json({ message: 'Adoption cancelled', reason, pendingAdoptions: dogs });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
// POST /api/dogs/:id/adopt-confirm
const confirmAdoption = async (req, res) => {
  try {
    const dogId = req.params.id || req.body.dogId;
    const dog = await Dog.findById(dogId);
    if (!dog) return res.status(404).json({ message: 'Dog not found' });
    if (dog.adoptionStatus !== 'pending' || !dog.adoptionQueue) {
      return res.status(400).json({ message: 'No pending adoption for this dog' });
    }
    const userId = req.user._id.toString();
    const ownerId = dog.user.toString();
    const adopterId = dog.adoptionQueue.adopter?.toString();
    if (userId === ownerId) {
      dog.adoptionQueue.ownerConfirmed = true;
    } else if (userId === adopterId) {
      dog.adoptionQueue.adopterConfirmed = true;
    } else {
      return res.status(403).json({ message: 'Not authorized to confirm adoption' });
    }
    // If both confirmed, mark as adopted and remove from DB
    if (dog.adoptionQueue.ownerConfirmed && dog.adoptionQueue.adopterConfirmed) {
      dog.adoptionStatus = 'adopted';
      // Send message to both users that dog is adopted
      // Send chat messages to both users
      try {
        const ownerId = dog.user.toString();
        const adopterId = dog.adoptionQueue.adopter.toString();
        let convo = await ChatConversation.findOne({ participants: { $all: [ownerId, adopterId] } });
        if (convo) {
          // Message to owner
          const ownerMsg = `Congratulations! Your dog ${dog.name} has been adopted.`;
          await ChatMessage.create({ conversationId: convo._id, sender: ownerId, recipient: adopterId, message: ownerMsg });
          // Message to adopter
          const adopterMsg = `Congratulations! You have successfully adopted the dog ${dog.name}.`;
          await ChatMessage.create({ conversationId: convo._id, sender: adopterId, recipient: ownerId, message: adopterMsg });
          // System message to both
          const sysMsg = `Adoption of dog ${dog.name} is now complete.`;
          await ChatMessage.create({ conversationId: convo._id, sender: null, recipient: null, message: sysMsg });
          await ChatConversation.findByIdAndUpdate(convo._id, { updatedAt: Date.now() });
          if (io) {
            io.to(ownerId).emit('receiveMessage', { conversationId: convo._id, sender: null, message: sysMsg });
            io.to(adopterId).emit('receiveMessage', { conversationId: convo._id, sender: null, message: sysMsg });
          }
        }
      } catch (msgErr) {
        console.warn('Failed to send adoption confirmation message:', msgErr);
      }
      await dog.deleteOne();
      console.log(`[CONFIRM ADOPTION] Dog ${dogId} adopted and removed. Both confirmed.`);
      const userIdForQuery = req.user._id;
      const dogs = await Dog.find({
        $or: [
          { user: userIdForQuery, adoptionStatus: 'pending' },
          { 'adoptionQueue.adopter': userIdForQuery, adoptionStatus: 'pending' }
        ]
      });
      return res.json({ message: 'Dog adopted and removed from database', pendingAdoptions: dogs });
    } else {
      await dog.save();
      if (io) {
        io.to(ownerId).emit('refreshConversations');
        io.to(adopterId).emit('refreshConversations');
      }
      console.log(`[CONFIRM ADOPTION] Dog ${dogId} confirmation saved. Status: ${dog.adoptionStatus}`);
      const userIdForQuery2 = req.user._id;
      const dogs2 = await Dog.find({
        $or: [
          { user: userIdForQuery2, adoptionStatus: 'pending' },
          { 'adoptionQueue.adopter': userIdForQuery2, adoptionStatus: 'pending' }
        ]
      });
      return res.json({ message: 'Adoption confirmation saved', adoptionQueue: dog.adoptionQueue, pendingAdoptions: dogs2 });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};;
// POST /api/dogs/:id/adopt-request
const requestAdoption = async (req, res) => {
  try {
    const dog = await Dog.findById(req.params.id).populate('user', 'email name');
    if (!dog) return res.status(404).json({ message: 'Dog not found' });
    if (dog.adoptionStatus === 'pending' && dog.adoptionQueue && dog.adoptionQueue.adopter) {
      // If already pending with this adopter, do not reset
      if (dog.adoptionQueue.adopter.toString() === req.user._id.toString()) {
        return res.status(400).json({ message: 'Adoption request already pending confirmation.' });
      } else {
        return res.status(400).json({ message: 'Dog is already pending adoption by another user.' });
      }
    }
    if (dog.adoptionStatus !== 'available') {
      return res.status(400).json({ message: 'Dog is not available for adoption' });
    }
    // Set adoption queue and status
    dog.adoptionStatus = 'pending';
    dog.adoptionQueue = {
      adopter: req.user._id,
      ownerConfirmed: false,
      adopterConfirmed: false
    };
    await dog.save();
    // Send message to owner instead of email
    try {
      const ownerId = dog.user.toString();
      const adopterId = req.user._id.toString();
      // Get or create conversation
      let convo = await ChatConversation.findOne({ participants: { $all: [adopterId, ownerId] } });
      if (!convo) {
        convo = await ChatConversation.create({ participants: [adopterId, ownerId] });
      }
      // Send improved message from adopter to owner
      const adopterUser = await User.findById(adopterId);
      const dogDetails = [
        `Dog: ${dog.name}`,
        dog.breed ? `Breed: ${dog.breed}` : '',
        dog.age ? `Age: ${dog.age}` : ''
      ].filter(Boolean).join(', ');
      const adopterDetails = adopterUser ? `Adopter: ${adopterUser.name} (${adopterUser.username})` : `Adopter: ${adopterId}`;
      const messageText = `Adoption Request\n${dogDetails}\n${adopterDetails}\n\nPlease confirm the adoption in your chat window by clicking the 'Confirm Adoption' button.`;
      const msg = await ChatMessage.create({ 
        conversationId: convo._id, 
        sender: adopterId, 
        recipient: ownerId, 
        message: messageText 
      });
      await ChatConversation.findByIdAndUpdate(convo._id, { updatedAt: Date.now() });
      // Emit to recipient (owner)
      if (io) {
        io.to(ownerId).emit('receiveMessage', { conversationId: convo._id, sender: adopterId, message: messageText, sentAt: msg.sentAt });
        io.to(ownerId).emit('refreshConversations');
        io.to(adopterId).emit('refreshConversations');
      }
    } catch (msgErr) {
      console.warn('Failed to send adoption request message:', msgErr);
    }
    // Emit socket events to refresh conversations and pending adoptions for both users
    if (io) {
      io.to(ownerId).emit('refreshConversations');
      io.to(adopterId).emit('refreshConversations');
    }
    res.json({ message: 'Adoption request sent', dog });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
          if (dog.adoptionQueue.ownerConfirmed && dog.adoptionQueue.adopterConfirmed) {
            dog.adoptionStatus = 'adopted';
            // Send message to both users that dog is adopted
            // Send chat messages to both users
            try {
              const ownerId = dog.user.toString();
              const adopterId = dog.adoptionQueue.adopter.toString();
              let convo = await ChatConversation.findOne({ participants: { $all: [ownerId, adopterId] } });
              if (convo) {
                // Message to owner
                const ownerMsg = `Congratulations! Your dog ${dog.name} has been adopted.`;
                await ChatMessage.create({ conversationId: convo._id, sender: ownerId, recipient: adopterId, message: ownerMsg });
                // Message to adopter
                const adopterMsg = `Congratulations! You have successfully adopted the dog ${dog.name}.`;
                await ChatMessage.create({ conversationId: convo._id, sender: adopterId, recipient: ownerId, message: adopterMsg });
                // System message to both
                const sysMsg = `Adoption of dog ${dog.name} is now complete.`;
                await ChatMessage.create({ conversationId: convo._id, sender: null, recipient: null, message: sysMsg });
                await ChatConversation.findByIdAndUpdate(convo._id, { updatedAt: Date.now() });
                if (io) {
                  io.to(ownerId).emit('receiveMessage', { conversationId: convo._id, sender: null, message: sysMsg });
                  io.to(adopterId).emit('receiveMessage', { conversationId: convo._id, sender: null, message: sysMsg });
                }
              }
            } catch (msgErr) {
              console.warn('Failed to send adoption confirmation message:', msgErr);
            }
            await dog.deleteOne();
            console.log(`[CONFIRM ADOPTION] Dog ${dogId} adopted and removed. Both confirmed.`);
            // Return updated pending adoptions for debugging
            const userIdForQuery = req.user._id;
            const dogs = await Dog.find({
              $or: [
                { user: userIdForQuery, adoptionStatus: 'pending' },
                { 'adoptionQueue.adopter': userIdForQuery, adoptionStatus: 'pending' }
              ]
            });
            return res.json({ message: 'Dog adopted and removed from database', pendingAdoptions: dogs });
          } else {
            // If not both confirmed, save and emit events
            await dog.save();
            // Emit socket events to refresh conversations and pending adoptions for both users
            if (io) {
              io.to(ownerId).emit('refreshConversations');
              io.to(adopterId).emit('refreshConversations');
            }
            console.log(`[CONFIRM ADOPTION] Dog ${dogId} confirmation saved. Status: ${dog.adoptionStatus}`);
            // Return updated pending adoptions for debugging
            const userIdForQuery2 = req.user._id;
            const dogs2 = await Dog.find({
              $or: [
                { user: userIdForQuery2, adoptionStatus: 'pending' },
                { 'adoptionQueue.adopter': userIdForQuery2, adoptionStatus: 'pending' }
              ]
            });
            return res.json({ message: 'Adoption confirmation saved', adoptionQueue: dog.adoptionQueue, pendingAdoptions: dogs2 });
          }
    
    // Remove images not in keepImages and delete from local uploads if needed
    if (Array.isArray(dog.images) && keepImages.length >= 0) {
      const removedImages = dog.images.filter(img => !keepImages.includes(img.url));
      // Remove files from local uploads if needed
      const uploadDir = path.join(process.cwd(), 'uploads', 'dogs', String(dog._id));
      for (const img of removedImages) {
        if (img.url && typeof img.url === 'string' && (img.url.includes(`/u/dogs/${dog._id}/`) || img.url.includes(`/uploads/dogs/${dog._id}/`))) {
          const fileName = img.url.includes(`/u/dogs/${dog._id}/`) 
            ? img.url.split(`/u/dogs/${dog._id}/`)[1] 
            : img.url.split(`/uploads/dogs/${dog._id}/`)[1];
          if (fileName) {
            const filePath = path.join(uploadDir, fileName);
            try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
          }
        }
      }
      dog.images = dog.images.filter(img => keepImages.includes(img.url));
    }

    // Handle new uploaded images (media) - save to local uploads
    if (req.files && req.files.media) {
      console.log('Processing new media files for local uploads...');
      const mediaArray = Array.isArray(req.files.media) ? req.files.media : [req.files.media];
      console.log('Media array length:', mediaArray.length);
      const uploadDir = path.join(process.cwd(), 'uploads', 'dogs', String(dog._id));
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      for (const mediaFile of mediaArray) {
          console.log(`[UPLOAD-DEBUG] Processing file: ${mediaFile.originalname}, mimetype: ${mediaFile.mimetype}, size: ${mediaFile.size}`);
        // Log mimetype and extension for debugging
        console.log(`[UPLOAD] File: ${mediaFile.originalname}, mimetype: ${mediaFile.mimetype}`);
        // Always extract EXIF orientation from the original upload buffer (before any conversion)
        const orientationTransform = getOrientationTransform(mediaFile.buffer);
        console.log(`[ORIENTATION] ${mediaFile.originalname}: Detected orientation transform:`, orientationTransform);
        // Detect HEIC/HEIF and convert to JPEG buffer if needed
        let processedBuffer = mediaFile.buffer;
        if (
          mediaFile.mimetype === 'image/heic' ||
          mediaFile.mimetype === 'image/heif' ||
          (mediaFile.originalname && /\.heic|\.heif$/i.test(mediaFile.originalname))
        ) {
          try {
            processedBuffer = await heicBufferToJpeg(mediaFile.buffer);
            console.log(`[HEIC/HEIF] heic-convert: Converted ${mediaFile.originalname} to JPEG for processing.`);
          } catch (err) {
            console.warn(`[HEIC/HEIF] heic-convert failed for ${mediaFile.originalname}. Rejecting upload.`);
            throw new Error('HEIC/HEIF images are not supported on this server. Please export as JPEG and try again.');
          }
        }
        if (mediaFile.mimetype.startsWith('image/')) {
          const imageVariants = [];
          const ext = '.jpg';
          const baseName = path.parse(mediaFile.originalname).name.replace(/[^a-zA-Z0-9_-]/g, '');
          for (const w of [320, 640, 1024]) {
            const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            const outName = `${baseName}-${uniqueSuffix}-${w}${ext}`;
            const outPath = path.join(uploadDir, outName);
            let sharpInstance = sharp(processedBuffer);
            if (orientationTransform.rotate) {
              console.log(`[ORIENTATION] ${mediaFile.originalname}: Applying rotate(${orientationTransform.rotate})`);
              sharpInstance = sharpInstance.rotate(orientationTransform.rotate);
            }
            if (orientationTransform.flip) {
              console.log(`[ORIENTATION] ${mediaFile.originalname}: Applying flip()`);
              sharpInstance = sharpInstance.flip();
            }
            if (orientationTransform.flop) {
              console.log(`[ORIENTATION] ${mediaFile.originalname}: Applying flop()`);
              sharpInstance = sharpInstance.flop();
            }
            const buffer = await sharpInstance
              .resize({ width: w })
              .jpeg({ quality: 90 })
              .withMetadata()
              .toBuffer();
            fs.writeFileSync(outPath, buffer);
            imageVariants.push({ url: `/u/dogs/${dog._id}/${outName}`, width: w, size: `${w}` });
          }
          // Save original buffer as-is (converted and oriented)
          const origUniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          const origName = `${baseName}-${origUniqueSuffix}-orig.jpg`;
          const origPath = path.join(uploadDir, origName);
          let sharpOrig = sharp(processedBuffer);
          if (orientationTransform.rotate) {
            console.log(`[ORIENTATION] ${mediaFile.originalname} (orig): Applying rotate(${orientationTransform.rotate})`);
            sharpOrig = sharpOrig.rotate(orientationTransform.rotate);
          }
          if (orientationTransform.flip) {
            console.log(`[ORIENTATION] ${mediaFile.originalname} (orig): Applying flip()`);
            sharpOrig = sharpOrig.flip();
          }
          if (orientationTransform.flop) {
            console.log(`[ORIENTATION] ${mediaFile.originalname} (orig): Applying flop()`);
            sharpOrig = sharpOrig.flop();
          }
          const origBuffer = await sharpOrig
            .jpeg({ quality: 95 })
            .withMetadata()
            .toBuffer();
          fs.writeFileSync(origPath, origBuffer);
          imageVariants.push({ url: `/u/dogs/${dog._id}/${origName}`, width: null, size: 'orig' });
          dog.images.push(...imageVariants);
        }
      }
      // Generate and save 64px thumbnail from first image
      if (mediaArray.length > 0 && mediaArray[0].mimetype.startsWith('image/')) {
        try {
          const thumbName = `thumb-64.jpg`;
          const thumbPath = path.join(uploadDir, thumbName);
          const thumbBuffer = await sharp(mediaArray[0].buffer)
            .rotate()
            .resize({ width: 64 })
            .jpeg({ quality: 70 })
            .withMetadata()
            .toBuffer();
          fs.writeFileSync(thumbPath, thumbBuffer);
          dog.thumbnail = { url: `/u/dogs/${dog._id}/${thumbName}`, width: 64, size: '64' };
        } catch (thumbErr) {
          console.warn('Thumbnail creation failed', thumbErr);
        }
      }
      console.log('Final images count:', dog.images.length);
    } else {
      console.log('No new media files to process');
    }

    await dog.save();
    console.log('Dog saved successfully. Final images count:', dog.images ? dog.images.length : 0);
    console.log('Dog images:', dog.images);
    console.log('Dog thumbnail:', dog.thumbnail);
    console.log('=== UPDATE COMPLETE ===');
    // Re-fetch the updated dog with populated user info
    const updatedDog = await Dog.findById(dog._id).populate('user', 'name username email phone person');
    console.log('UpdatedDog response images:', updatedDog.images);
    res.json(updatedDog);
  } catch (err) {
    console.error('UpdateDog error:', err);
    if (err && err.stack) console.error(err.stack);
    res.status(500).json({ message: 'Server error', error: err.message, stack: err.stack });
  }
};

// DELETE /api/dogs/:id

// DELETE /api/dogs/:id
export const deleteDog = async (req, res) => {
  try {
    console.log('DELETE /api/dogs/:id called with id:', req.params.id);
    const dog = await Dog.findById(req.params.id);
    if (!dog) {
      console.warn('Dog not found for id:', req.params.id);
      return res.status(404).json({ message: 'Dog not found', id: req.params.id });
    }
    
    // Authorization check: only the user who created the dog or superadmin can delete it
    const isSuperAdmin = req.user.role === 'superadmin';
    const isOwner = dog.user.toString() === req.user._id.toString();
    
    if (!isOwner && !isSuperAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this dog' });
    }
    // Remove all files in uploads/dogs/<id>
    const uploadDir = path.join(process.cwd(), 'uploads', 'dogs', String(dog._id));
    try {
      if (fs.existsSync(uploadDir)) {
        fs.readdirSync(uploadDir).forEach(f => {
          try { fs.unlinkSync(path.join(uploadDir, f)); } catch (fileErr) { console.warn('Failed to delete file:', f, fileErr); }
        });
        try { fs.rmdirSync(uploadDir); } catch (dirErr) { console.warn('Failed to remove dir:', uploadDir, dirErr); }
      } else {
        console.log('Upload dir does not exist:', uploadDir);
      }
    } catch (e) {
      console.warn('Error cleaning up files for dog:', dog._id, e);
    }
    await dog.deleteOne();
    console.log('Dog deleted:', dog._id);
    res.json({ message: 'Dog deleted', id: dog._id });
  } catch (err) {
    console.error('Error in deleteDog:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const sizes = [320, 640, 1024];

export const createDog = async (req, res) => {
    console.log('=== [createDog] Incoming request ===');
    console.log('req.body:', req.body);
    console.log('req.files:', req.files);
    if (req.files && req.files.media) {
      console.log('req.files.media:', req.files.media);
    } else {
      console.warn('No media files received in req.files.media');
    }
  try {
    // expected fields: name, breed, age, description, location, color, size, gender, vaccinated, neutered
    const { name, breed, age, description, location, color, size, gender, vaccinated, neutered } = req.body;

    if (!name) return res.status(400).json({ message: 'Name required' });

    // normalize booleans that may come as strings
    const vaccinatedBool = vaccinated === 'true' || vaccinated === 'on' || vaccinated === true;
    const neuteredBool = neutered === 'true' || neutered === 'on' || neutered === true;

    // create doc to get id
    const dog = new Dog({ 
      name, 
      breed, 
      age, 
      description, 
      location, 
      color, 
      size, 
      gender, 
      vaccinated: vaccinatedBool, 
      neutered: neuteredBool,
      user: req.user._id,
      images: []
    });
    await dog.save();

    const uploadDir = path.join(process.cwd(), 'uploads', 'dogs', String(dog._id));
    // Ensure local uploadDir creation for images.
    // files from multer (memory storage)
    // image file field name: 'media' (image or video)
    // optional poster image for videos: 'poster'
    if (req.files && req.files.media && req.files.media.length > 0) {
      const mediaArray = Array.isArray(req.files.media) ? req.files.media : [req.files.media];
      const uploadDir = path.join(process.cwd(), 'uploads', 'dogs', String(dog._id));
      fs.mkdirSync(uploadDir, { recursive: true });
      let mediaIndex = 0;
      for (const mediaFile of mediaArray) {
        if (mediaFile.mimetype.startsWith('image/')) {
          const imageVariants = [];
          const ext = '.jpg';
          const baseName = `img-${mediaIndex}`;
          for (const w of [320, 640, 1024]) {
            const outName = `${baseName}-${w}${ext}`;
            const outPath = path.join(uploadDir, outName);
            const buffer = await sharp(mediaFile.buffer)
              .rotate()
              .resize({ width: w })
              .withMetadata()
              .jpeg({ quality: 90 })
              .toBuffer();
            fs.writeFileSync(outPath, buffer);
            imageVariants.push({ url: `/u/dogs/${dog._id}/${outName}`, width: w, size: `${w}` });
          }
          // Save original
          const origName = `${baseName}-orig${ext}`;
          const origPath = path.join(uploadDir, origName);
          fs.writeFileSync(origPath, mediaFile.buffer);
          imageVariants.push({ url: `/u/dogs/${dog._id}/${origName}`, width: null, size: 'orig' });
          dog.images.push(...imageVariants);
          mediaIndex++;
        } else if (mediaFile.mimetype.startsWith('video/')) {
          const videoExt = path.extname(mediaFile.originalname) || '.mp4';
          const videoName = `video-${mediaIndex}${videoExt}`;
          const videoPath = path.join(uploadDir, videoName);
          fs.writeFileSync(videoPath, mediaFile.buffer);
          dog.video = { url: `/u/dogs/${dog._id}/${videoName}`, poster: [] };
          mediaIndex++;
          // process poster image if provided
          if (req.files.poster && req.files.poster[0]) {
            const posterFile = req.files.poster[0];
            const posterVariants = [];
            const ext = '.jpg';
            await Promise.all(sizes.map(async (w) => {
              const outName = `poster-${w}${ext}`;
              const outPath = path.join(uploadDir, outName);
              const buffer = await sharp(posterFile.buffer)
                .rotate()
                .resize({ width: w })
                .withMetadata()
                .jpeg({ quality: 80 })
                .toBuffer();
              fs.writeFileSync(outPath, buffer);
              posterVariants.push({ url: `/u/dogs/${dog._id}/${outName}`, width: w, size: `${w}` });
            }));
            dog.video.poster = posterVariants;
            // create a tiny 64px thumbnail from the poster for list display (if thumbnail not set)
            if (!dog.thumbnail) {
              try {
                const thumbName = `thumb-64${ext}`;
                const thumbPath = path.join(uploadDir, thumbName);
                const thumbBuffer = await sharp(posterFile.buffer)
                  .rotate()
                  .resize({ width: 64 })
                  .withMetadata()
                  .jpeg({ quality: 70 })
                  .toBuffer();
                fs.writeFileSync(thumbPath, thumbBuffer);
                dog.thumbnail = { url: `/u/dogs/${dog._id}/${thumbName}`, width: 64, size: '64' };
              } catch (thumbErr) {
                console.warn('Thumbnail creation failed', thumbErr);
              }
            }
          }
        }
      }
      // Generate and save 64px thumbnail from first image if not set
      const firstImageFile = mediaArray.find(f => f.mimetype.startsWith('image/'));
      if (firstImageFile && !dog.thumbnail) {
        try {
          const thumbName = `thumb-64.jpg`;
          const thumbPath = path.join(uploadDir, thumbName);
          const thumbBuffer = await sharp(firstImageFile.buffer)
            .rotate()
            .resize({ width: 64 })
            .withMetadata()
            .jpeg({ quality: 70 })
            .toBuffer();
          fs.writeFileSync(thumbPath, thumbBuffer);
          dog.thumbnail = { url: `/u/dogs/${dog._id}/${thumbName}`, width: 64, size: '64' };
        } catch (thumbErr) {
          console.warn('Thumbnail creation failed', thumbErr);
        }
      }
    }

    await dog.save();
    // Re-fetch dog with populated user info
    const populatedDog = await Dog.findById(dog._id).populate('user', 'name username email phone person');
    console.log('New dog images:', populatedDog.images?.map(img => img.url));
    console.log('New dog thumbnail:', populatedDog.thumbnail?.url);
    console.log('New dog video:', populatedDog.video?.url);
    res.status(201).json(populatedDog);
  } catch (err) {
    console.error('CreateDog error:', err);
    if (err && err.stack) console.error(err.stack);
    res.status(500).json({ message: 'Server error', error: err.message, stack: err.stack });
  }
};

};
    return url.replace('https://sharedog-homeless-backend.onrender.com', '');
  }
  return url;
}
    const dogsWithAdoption = dogs.map(dog => {
      const obj = dog.toObject();
      // Patch images array
      if (Array.isArray(obj.images)) {
        obj.images = obj.images.map(img => ({ ...img, url: fixUrl(img.url) }));
      }
      // Patch thumbnail
      if (obj.thumbnail && obj.thumbnail.url) {
        obj.thumbnail.url = fixUrl(obj.thumbnail.url);
      }
      // Patch video poster
      if (obj.video && Array.isArray(obj.video.poster)) {
        obj.video.poster = obj.video.poster.map(img => ({ ...img, url: fixUrl(img.url) }));
      }
      // Patch video url
      if (obj.video && obj.video.url) {
        obj.video.url = fixUrl(obj.video.url);
      }
      if (typeof obj.adoptionStatus === 'undefined') obj.adoptionStatus = 'available';
      if (typeof obj.adoptionQueue === 'undefined') obj.adoptionQueue = null;
      return obj;
    });
    res.json(dogsWithAdoption);
  } catch (err) {
    console.error('[listDogs] Error:', err);
    if (err && err.stack) console.error('[listDogs] Stack:', err.stack);
    res.status(500).json({ message: 'Server error', error: err.message, stack: err.stack });
  }
};

export const getDogById = async (req, res) => {
  try {
    const dog = await Dog.findById(req.params.id)
      .populate('user', 'name username email phone person');
    if (!dog) {
      return res.status(404).json({ message: 'Dog not found' });
    }
    // Ensure adoptionStatus and adoptionQueue are always present
    const obj = dog.toObject();
    if (typeof obj.adoptionStatus === 'undefined') obj.adoptionStatus = 'available';
    if (typeof obj.adoptionQueue === 'undefined') obj.adoptionQueue = null;
    res.json(obj);
  } catch (err) {
    console.error('[getDogById] Error:', err);
    if (err && err.stack) console.error('[getDogById] Stack:', err.stack);
    res.status(500).json({ message: 'Server error', error: err.message, stack: err.stack });
  }
};

// POST /api/dogs/:id/like
export const likeDog = async (req, res) => {
  try {
    const dog = await Dog.findById(req.params.id);
    if (!dog) {
      return res.status(404).json({ message: 'Dog not found' });
    }

    // Check if already liked
    if (dog.likes.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already liked this dog' });
    }

    // Add user to likes array
    dog.likes.push(req.user._id);
    await dog.save();

    res.json({ message: 'Dog liked', likesCount: dog.likes.length });
  } catch (err) {
    console.error('Like dog error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/dogs/:id/like
export const unlikeDog = async (req, res) => {
  try {
    const dog = await Dog.findById(req.params.id);
    if (!dog) {
      return res.status(404).json({ message: 'Dog not found' });
    }

    // Remove user from likes array
    dog.likes = dog.likes.filter(userId => userId.toString() !== req.user._id.toString());
    await dog.save();

    res.json({ message: 'Dog unliked', likesCount: dog.likes.length });
  } catch (err) {
    console.error('Unlike dog error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/dogs/pending-adoptions
export const getPendingAdoptions = async (req, res) => {
    console.log('[getPendingAdoptions] userId:', req.user._id);
  try {
    const userId = req.user._id;
    // Find all dogs with pending adoption where user is owner or adopter
    const dogs = await Dog.find({
      adoptionStatus: 'pending',
      $or: [
        { user: userId },
        { 'adoptionQueue.adopter': userId }
      ]
    })
    .populate({ path: 'user', select: 'name username _id' })
    .populate({ path: 'adoptionQueue.adopter', select: 'name username _id' });
    res.json(dogs);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  cancelAdoption,
  confirmAdoption,
  requestAdoption
};
