const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const Dog = require('../models/dogModel');
const ChatConversation = require('../models/chatConversationModel');
const ChatMessage = require('../models/chatMessageModel');

const { getOrientationTransform } = require('../utils/orientation');


// PATCH /api/dogs/:id
const updateDog = async (req, res) => {
  console.log('================ UPDATE DOG DEBUG ================');
  console.log('[UPDATE DEBUG] req.body:', JSON.stringify(req.body, null, 2));
  console.log('[UPDATE DEBUG] req.files:', req.files);
  try {
    // Fetch the dog by ID
    const dogId = req.params.id;
    const dog = await Dog.findById(dogId);
    if (!dog) {
      return res.status(404).json({ message: 'Dog not found' });
    }
    // Get keepImages from request body or default to empty array
    let keepImages = req.body.keepImages;
    if (typeof keepImages === 'string') {
      try {
        // Accept both '[]' and '' as empty
        keepImages = keepImages.trim() === '' ? [] : JSON.parse(keepImages);
      } catch (e) {
        keepImages = [];
      }
    }
    if (!Array.isArray(keepImages)) keepImages = [];

    // Update all editable fields from req.body
    const editableFields = [
      'name', 'breed', 'age', 'color', 'location', 'description', 'size', 'gender', 'vaccinated', 'neutered'
    ];
    editableFields.forEach(field => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        let value = req.body[field];
        // Convert booleans from string if needed
        if (field === 'vaccinated' || field === 'neutered') {
          value = value === 'true' || value === true || value === 'on';
        }
        // Convert age to number if needed
        if (field === 'age' && value !== undefined && value !== null && value !== '') {
          value = Number(value);
        }
        dog[field] = value;
      }
    });

    // Ensure dog.images is always an array
    if (!Array.isArray(dog.images)) dog.images = [];

    if (Array.isArray(keepImages)) {
      if (keepImages.length > 0) {
        const removedImages = dog.images.filter(img => !keepImages.includes(img.url));
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
      } else {
        // If keepImages is an empty array, remove all images
        console.log('[DELETE DEBUG] keepImages is empty array, clearing dog.images and saving...');
        dog.images = [];
        await dog.save();
        console.log('[DELETE DEBUG] dog.images after save:', dog.images);
      }
    }
    // If keepImages is empty and no new images are uploaded, remove all images
    if ((!keepImages || keepImages.length === 0) && (!req.files || !req.files.media)) {
      console.log('[DELETE DEBUG] keepImages is empty, setting dog.images = [] and saving...');
      dog.images = [];
      await dog.save();
      console.log('[DELETE DEBUG] dog.images after save:', dog.images);
    }
    console.log('[SAVE DEBUG] Before save, dog.images:', dog.images);

    // Handle new uploaded images (media) - save to local uploads
    if (req.files && req.files.media) {
      console.log('Processing new media files for local uploads...');
      const mediaArray = Array.isArray(req.files.media) ? req.files.media : [req.files.media];
      console.log('Media array length:', mediaArray.length);
      const uploadDir = path.join(process.cwd(), 'uploads', 'dogs', String(dog._id));
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      let mediaIndex = 0;
      for (const mediaFile of mediaArray) {
        console.log(`[UPLOAD-DEBUG] Processing file: ${mediaFile.originalname}, mimetype: ${mediaFile.mimetype}, size: ${mediaFile.size}`);
        console.log(`[UPLOAD] File: ${mediaFile.originalname}, mimetype: ${mediaFile.mimetype}`);
        const orientationTransform = getOrientationTransform(mediaFile.buffer);
        console.log(`[ORIENTATION] ${mediaFile.originalname}: Detected orientation transform:`, orientationTransform);
        let processedBuffer = mediaFile.buffer;
        if (
          mediaFile.mimetype === 'image/heic' ||
          mediaFile.mimetype === 'image/heif' ||
          (mediaFile.originalname && /.heic|.heif$/i.test(mediaFile.originalname))
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
            try {
              const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
              const outName = `${baseName}-${uniqueSuffix}-${w}${ext}`;
              const outPath = path.join(uploadDir, outName);
              let sharpInstance = sharp(processedBuffer);
              // Optionally apply orientationTransform here if needed
              const buffer = await sharpInstance.resize({ width: w }).withMetadata().jpeg({ quality: 90 }).toBuffer();
              fs.writeFileSync(outPath, buffer);
              console.log(`[IMAGE SAVE] Saved variant: ${outPath}`);
              imageVariants.push({ url: `/u/dogs/${dog._id}/${outName}`, width: w, size: `${w}` });
            } catch (imgErr) {
              console.error(`[IMAGE ERROR] Failed to save variant for width ${w}:`, imgErr);
            }
          }
          // Save original
          try {
            const origName = `${baseName}-orig.jpg`;
            const origPath = path.join(uploadDir, origName);
            fs.writeFileSync(origPath, processedBuffer);
            console.log(`[IMAGE SAVE] Saved original: ${origPath}`);
            imageVariants.push({ url: `/u/dogs/${dog._id}/${origName}`, width: null, size: 'orig' });
          } catch (origErr) {
            console.error('[IMAGE ERROR] Failed to save original image:', origErr);
          }
          dog.images.push(...imageVariants);
          mediaIndex++;
        }
      }
    }
    console.log('[SAVE DEBUG] About to save dog, images:', dog.images);
    await dog.save();
    console.log('[SAVE DEBUG] After save, dog.images:', dog.images);
    // Always fetch the latest dog object with populated fields after save
    const updatedDog = await Dog.findById(dog._id).lean();
    console.log(`[UPDATE DOG] Dog ${dog._id} updated successfully.`);
    console.log('[UPDATE DOG] updatedDog.images:', updatedDog.images);
    // Emit Socket.IO event to all clients
    const { io } = require('../socket');
    if (io) io.emit('dogUpdated', { dog: updatedDog });
    return res.status(200).json({ message: 'Dog updated successfully', dog: updatedDog });
  } catch (err) {
    console.error('[UPDATE DOG ERROR]', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// End updateDog
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
    let justConfirmed = false;
    if (userId === ownerId) {
      if (!dog.adoptionQueue.ownerConfirmed) {
        dog.adoptionQueue.ownerConfirmed = true;
        justConfirmed = true;
      }
    } else if (userId === adopterId) {
      if (!dog.adoptionQueue.adopterConfirmed) {
        dog.adoptionQueue.adopterConfirmed = true;
        justConfirmed = true;
      }
    } else {
      return res.status(403).json({ message: 'Not authorized to confirm adoption' });
    }
    // If both confirmed, mark as adopted and clear adoptionQueue, then allow removal elsewhere if needed
    if (dog.adoptionQueue.ownerConfirmed && dog.adoptionQueue.adopterConfirmed) {
      // Delete dog from DB after both confirmations
      const dogName = dog.name;
      try {
        let convo = await ChatConversation.findOne({ participants: { $all: [ownerId, adopterId] } });
        if (convo) {
          // Send translation keys and variables
          await ChatMessage.create({ conversationId: convo._id, sender: ownerId, recipient: adopterId, message: { key: 'adoptionConfirmed', dogName } });
          await ChatMessage.create({ conversationId: convo._id, sender: adopterId, recipient: ownerId, message: { key: 'adoptionConfirmed', dogName } });
          await ChatMessage.create({ conversationId: convo._id, sender: ownerId, recipient: adopterId, message: { key: 'adoptionCompletedClosed', dogName } });
          await ChatMessage.create({ conversationId: convo._id, sender: adopterId, recipient: ownerId, message: { key: 'adoptionCompletedClosed', dogName } });
          await ChatConversation.findByIdAndUpdate(convo._id, { updatedAt: Date.now() });
          // Use io property from socket.js
          const { io } = require('../socket');
          if (io) {
            io.to(ownerId).emit('receiveMessage', { conversationId: convo._id, sender: adopterId, message: { key: 'adoptionCompletedClosed', dogName } });
            io.to(adopterId).emit('receiveMessage', { conversationId: convo._id, sender: ownerId, message: { key: 'adoptionCompletedClosed', dogName } });
          }
        }
      } catch (msgErr) {
        console.warn('Failed to send adoption confirmation message:', msgErr);
      }
      console.log(`[CONFIRM ADOPTION] Attempting to delete dog. dogId: ${dogId}, type: ${typeof dogId}`);
      const deletedDog = await Dog.findByIdAndDelete(dogId);
      if (deletedDog) {
        console.log(`[CONFIRM ADOPTION] Dog deleted:`, deletedDog);
        console.log(`[CONFIRM ADOPTION] Dog ${dogId} adopted and deleted. Both confirmed.`);
      } else {
        console.error(`[CONFIRM ADOPTION] Dog ${dogId} NOT deleted! Check MongoDB and permissions.`);
        // Try to find the dog again for debugging
        const stillExists = await Dog.findById(dogId);
        if (stillExists) {
          console.error(`[CONFIRM ADOPTION] Dog still exists in DB:`, stillExists);
        } else {
          console.error(`[CONFIRM ADOPTION] Dog not found after failed delete.`);
        }
      }
      // Only set removed: true if dog was actually deleted
      return res.json({ message: 'Adoption confirmed and dog deleted', adopted: true, removed: !!deletedDog, dogId });
    } else if (justConfirmed) {
      await dog.save();
      return res.json({ message: 'Adoption confirmation registered. Waiting for other party.', adopted: false });
    } else {
      return res.json({ message: 'Already confirmed. Waiting for other party.', adopted: false });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// DELETE /api/dogs/:id

// DELETE /api/dogs/:id
const deleteDog = async (req, res) => {
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
    // Emit Socket.IO event to all clients
    const { io } = require('../socket');
    if (io) io.emit('dogDeleted', { id: dog._id });
    res.json({ message: 'Dog deleted', id: dog._id });
  } catch (err) {
    console.error('Error in deleteDog:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

const sizes = [320, 640, 1024];

const createDog = async (req, res) => {
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
    console.log(`[CONFIRM ADOPTION] Dog ${dog._id} after confirm/save. adoptionStatus: ${dog.adoptionStatus}, adoptionQueue:`, dog.adoptionQueue);

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
  }
// End createDog

function fixUrl(url) {
  if (!url) return url;
  if (url.startsWith('https://sharedog-homeless-backend.onrender.com')) {
    return url.replace('https://sharedog-homeless-backend.onrender.com', '');
  }
  return url;
}



const getDogById = async (req, res) => {
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

}
// POST /api/dogs/:id/like
const likeDog = async (req, res) => {
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
}
// DELETE /api/dogs/:id/like
const unlikeDog = async (req, res) => {
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
}
// GET /api/dogs/pending-adoptions
const getPendingAdoptions = async (req, res) => {
    console.log('[getPendingAdoptions] userId:', req.user._id);
  try {
    // Robustly match user IDs as strings
    const userId = req.user._id.toString();
    const dogs = await Dog.find({
      adoptionStatus: 'pending',
      'adoptionQueue.adopter': { $exists: true, $ne: null }
    })
      .populate({ path: 'user', select: 'name username _id' })
      .populate({ path: 'adoptionQueue.adopter', select: 'name username _id' });
    // Filter in JS to ensure string match for both owner and adopter, and adoptionQueue must exist
    const filtered = dogs.filter(dog => {
      if (!dog.adoptionQueue || !dog.adoptionQueue.adopter) return false;
      const ownerId = dog.user && dog.user._id ? dog.user._id.toString() : '';
      const adopterId = dog.adoptionQueue.adopter && dog.adoptionQueue.adopter._id ? dog.adoptionQueue.adopter._id.toString() : '';
      return ownerId === userId || adopterId === userId;
    });
    console.log(`[getPendingAdoptions] userId: ${userId}, found ${filtered.length} valid pending dogs`);
    return res.json(filtered);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}


// GET /api/dogs
const listDogs = async (req, res) => {
  try {
    const dogs = await Dog.find()
      .populate('user', 'name username')
      .sort({ createdAt: -1 });
    res.json(dogs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};


// Cancel adoption for a dog
const cancelAdoption = async (req, res) => {
  try {
    const dog = await Dog.findById(req.params.id);
    if (!dog) return res.status(404).json({ message: 'Dog not found' });

    // Only the owner or adopter can cancel
    const userId = req.user._id.toString();
    const isOwner = dog.user.toString() === userId;
    const isAdopter = dog.adoptionQueue && dog.adoptionQueue.adopter && dog.adoptionQueue.adopter.toString() === userId;
    if (!isOwner && !isAdopter) {
      return res.status(403).json({ message: 'Not authorized to cancel adoption for this dog' });
    }

    // Clear adoptionQueue and reset adoption status
    dog.adoptionQueue = undefined;
    dog.adoptionStatus = 'available';
    await dog.save();
    console.log(`[CANCEL ADOPTION] Dog ${dog._id} after cancel/save. adoptionStatus: ${dog.adoptionStatus}, adoptionQueue:`, dog.adoptionQueue);

    // Emit Socket.IO event to both owner and adopter so both see cancellation in chat
    try {
      const ownerId = dog.user && dog.user._id ? dog.user._id.toString() : dog.user.toString();
      const adopterId = req.user._id.toString();
      let convo = await ChatConversation.findOne({ participants: { $all: [ownerId, adopterId] } });
      if (!convo) {
        convo = await ChatConversation.create({ participants: [ownerId, adopterId] });
      }
      const sysMsg = `Adoption canceled for dog ${dog.name}.`;
      await ChatMessage.create({ conversationId: convo._id, sender: null, recipient: null, message: sysMsg });
      const { io } = require('../socket');
      if (io) {
        io.to(ownerId).emit('receiveMessage', { conversationId: convo._id, sender: null, message: sysMsg, messageType: 'adoption', dogId: dog._id });
        io.to(adopterId).emit('receiveMessage', { conversationId: convo._id, sender: null, message: sysMsg, messageType: 'adoption', dogId: dog._id });
      }
    } catch (e) {
      console.warn('Failed to emit adoption-cancel event to both users:', e);
    }
    res.json({ message: 'Adoption canceled', dog });
  } catch (err) {
    console.error('Cancel adoption error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// POST /api/dogs/:id/adopt-request
const adoptRequest = async (req, res) => {
  try {
    const dog = await Dog.findById(req.params.id);
    if (!dog) return res.status(404).json({ message: 'Dog not found' });
    if (dog.adoptionStatus !== 'available') {
      return res.status(400).json({ message: 'Dog is not available for adoption' });
    }
    // Only allow one pending adopter at a time
    if (dog.adoptionQueue && dog.adoptionQueue.adopter) {
      return res.status(400).json({ message: 'There is already a pending adoption request for this dog' });
    }
    dog.adoptionStatus = 'pending';
    dog.adoptionQueue = {
      adopter: req.user._id,
      ownerConfirmed: false,
      adopterConfirmed: false
    };
    console.log(`[ADOPT REQUEST] Dog ${dog._id} after adopt request. adoptionStatus: ${dog.adoptionStatus}, adoptionQueue:`, dog.adoptionQueue);
    await dog.save();

    // Emit Socket.IO event to both owner and adopter so both see the request in chat
    try {
      const ownerId = dog.user && dog.user._id ? dog.user._id.toString() : dog.user.toString();
      const adopterId = req.user._id.toString();
      // Find or create conversation
      let convo = await ChatConversation.findOne({ participants: { $all: [ownerId, adopterId] } });
      if (!convo) {
        convo = await ChatConversation.create({ participants: [ownerId, adopterId] });
      }
      const sysMsg = `Adoption process started for dog ${dog.name}. Please confirm adoption if you agree.`;
      await ChatMessage.create({ conversationId: convo._id, sender: null, recipient: null, message: sysMsg });
      // Use io property from socket.js
      const { io } = require('../socket');
      if (io) {
        io.to(ownerId).emit('receiveMessage', { conversationId: convo._id, sender: null, message: sysMsg, messageType: 'adoption', dogId: dog._id });
        io.to(adopterId).emit('receiveMessage', { conversationId: convo._id, sender: null, message: sysMsg, messageType: 'adoption', dogId: dog._id });
      }
    } catch (e) {
      console.warn('Failed to emit adoption-request event to both users:', e);
    }

    res.json({ message: 'Adoption request submitted', dog });
  } catch (err) {
    console.error('Adopt request error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  updateDog,
  deleteDog,
  createDog,
  getDogById,
  likeDog,
  unlikeDog,
  getPendingAdoptions,
  confirmAdoption,
  listDogs,
  cancelAdoption,
  adoptRequest
};