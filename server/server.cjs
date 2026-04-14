console.log('[SERVER DEBUG] server.cjs loaded and running');

const dotenv = require("dotenv");
dotenv.config({ path: __dirname + '/.env' });

const express = require("express");
const path = require('path');
const http = require('http');
const connectDB = require('./db/connectDB.js');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport.js');
const userRoutes = require("./routes/userRoutes.js");
const dogRoutes = require("./routes/dogRoutes.js");
const authRoutes = require("./routes/authRoutes.js");
const statsRoutes = require("./routes/statsRoutes.js");
const testCloudinaryRoute = require("./routes/test-cloudinary-route.js");
const auth = require('./middleware/auth.js');
const cors = require('cors');
const chatRoutes = require('./routes/chatRoutes.js'); // <-- Add this here
const adoptionRoutes = require('./routes/adoptionRoutes.js'); // <-- Add adoption routes

// 2. Create the Express app FIRST

const app = express();

// Global error handler for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[FATAL ERROR] Uncaught Exception:', err);
  console.error('[FATAL ERROR] Stack:', err.stack);
  process.exit(1);
});

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL ERROR] Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

  // 3. Set up CORS middleware FIRST (more permissive for development)
  const allowedOrigins = [
    'http://localhost:3000',
    'http://172.20.10.4:3000',
    'https://eky-3xf1.onrender.com',
    'http://localhost:3001', // Backend development
    process.env.CLIENT_ORIGIN || 'https://eky-3xf1.onrender.com'
  ];

  // Security headers middleware to prevent copying and cloning
  app.use((req, res, next) => {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
    
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Prevent referrer leakage
    res.setHeader('Referrer-Policy', 'no-referrer');
    
    // Prevent search engines from indexing
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet, noimageindex');
    
    next();
  });

  app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('[CORS] Origin not allowed:', origin);
      callback(null, true); // Allow for now for debugging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 4. Load environment variables
dotenv.config({ path: '.env' });

// 5. Connect to DB
connectDB();

// 8. Set up body parsers
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cookieParser());

// 9. Initialize Passport
app.use(passport.initialize());

// 10. Use routes
app.use('/api/chat', chatRoutes);

// Use uploads directory at server directory to match where multer saves files
const uploadsPath = path.join(__dirname, 'uploads');
console.log('[STATIC DEBUG] uploadsPath resolved to:', uploadsPath);

// Apply CORS middleware to static file routes with permissive settings and security headers
const staticCors = cors({
  origin: '*',
  methods: ['GET', 'OPTIONS'],
  credentials: false,
  preflightContinue: false,
  optionsSuccessStatus: 200
});

// Hotlinking protection middleware
const checkReferrer = (req, res, next) => {
  const referrer = req.get('referer') || req.get('referrer');
  const host = req.get('host');
  
  // Allow requests with no referrer or from allowed origins
  if (!referrer || referrer.includes(host)) {
    next();
  } else {
    // Check if referrer is in allowed origins
    const isAllowed = allowedOrigins.some(origin => referrer.includes(origin.replace(/https?:\/\//, '')));
    if (isAllowed) {
      next();
    } else {
      // Block hotlinking
      console.log('[HOTLINK] Blocked request from:', referrer);
      res.status(403).send('Forbidden: Hotlinking not allowed');
    }
  }
};

app.use('/uploads', staticCors, checkReferrer, express.static(uploadsPath, {
  setHeaders: (res, filePath) => {
    console.log('[STATIC FILE] Serving:', filePath, 'Status: OK');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'false');
    res.setHeader('Vary', 'Origin');
    // Critical headers to prevent OpaqueResponseBlocking
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    // Anti-hotlinking headers
    res.setHeader('X-Robots-Tag', 'noimageindex');
    res.setHeader('Permissions-Policy', 'interest-cohort=()');
    // Set proper content type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm'
    };
    if (mimeTypes[ext]) {
      res.setHeader('Content-Type', mimeTypes[ext]);
    }
  }
}));

app.use('/u', staticCors, checkReferrer, express.static(uploadsPath, {
  setHeaders: (res, filePath) => {
    console.log('[STATIC FILE] Serving:', filePath, 'Status: OK');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'false');
    res.setHeader('Vary', 'Origin');
    // Critical headers to prevent OpaqueResponseBlocking
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    // Anti-hotlinking headers
    res.setHeader('X-Robots-Tag', 'noimageindex');
    res.setHeader('Permissions-Policy', 'interest-cohort=()');
    // Set proper content type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm'
    };
    if (mimeTypes[ext]) {
      res.setHeader('Content-Type', mimeTypes[ext]);
    }
  }
}));

app.use("/api/users", userRoutes);
app.use("/api/dogs", dogRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/adoption", adoptionRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/test", testCloudinaryRoute);

// Health check endpoint - must be after CORS middleware
app.get('/health', (req, res) => {
  try {
    const mongoose = require('mongoose');
    const health = {
      status: 'OK',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 3001,
      database: {
        status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        readyState: mongoose.connection.readyState,
        name: mongoose.connection.name || 'unknown',
        host: mongoose.connection.host || 'unknown'
      },
      memory: {
        used: process.memoryUsage().heapUsed / 1024 / 1024,
        total: process.memoryUsage().heapTotal / 1024 / 1024
      }
    };
    res.status(200).json(health);
  } catch (error) {
    console.error('[HEALTH CHECK ERROR]:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// If you want to use the auth middleware globally, use ONLY function, not the module object:
// const auth = require('./middleware/auth.js');
// app.use(auth); // Uncomment if you want global auth protection

// Start server after all middleware and routes are set up
const PORT = process.env.PORT || 3001;

const httpServer = http.createServer({ maxHeaderSize: 1024 * 1024 }, app);

// Configure timeout settings to prevent 502 errors
httpServer.setTimeout(60000); // 60 second timeout for requests
httpServer.keepAliveTimeout = 65000; // Keep-alive timeout
httpServer.headersTimeout = 66000; // Headers timeout

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started at:`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://172.20.10.4:${PORT}`);
  console.log(`  Timeouts configured: Request=60s, KeepAlive=65s, Headers=66s`);
});

const { Server: SocketIOServer } = require('socket.io');
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*', // Allow all origins for development (will be restricted in production)
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const { setIo } = require('./socket.js');
setIo(io);

// Load models for socket operations
const User = require('./models/userModel.js');
const ChatMessage = require('./models/chatMessageModel.js');
const ChatConversation = require('./models/chatConversationModel.js');
const { checkMessage: checkWordFilter } = require('./utils/wordFilter');

/**
 * Get warning message code and metadata based on violation type
 * @param {string} type - 'first', 'suspended', or 'deleted'
 * @returns {object} - Warning message with code and metadata
 */
function getWarningMessage(type) {
  const messages = {
    first: {
      code: 'firstWarning',
      violationCount: 1,
      suspensionEnd: null,
      isDeleted: false
    },
    suspended: {
      code: 'accountSuspended',
      violationCount: 2,
      suspensionEnd: new Date().setDate(new Date().getDate() + 30),
      isDeleted: false
    },
    deleted: {
      code: 'accountDeleted',
      violationCount: 3,
      suspensionEnd: null,
      isDeleted: true
    }
  };
  
  return messages[type] || messages.first;
}

// --- Online users tracking ---
const onlineUsers = new Map(); // userId -> { _id, userName, socketId }

io.on('connection', (socket) => {
  console.log('[Socket.IO] New connection from:', socket.id);
  console.log('[Socket.IO] Connection handshake origin:', socket.handshake.headers.origin);
  
  // Join user room and register online user
  socket.on('join', async (userId) => {
    console.log('[Socket.IO] join event for userId:', userId, 'socket.id:', socket.id);
    console.log('[Socket.IO] Socket rooms before join:', socket.rooms);
    
    // Ensure userId is a string for consistent room naming
    const roomName = String(userId);
    socket.join(roomName);
    
    console.log('[Socket.IO] Socket rooms after join:', socket.rooms);
    console.log('[Socket.IO] Joined room:', roomName);
    
    try {
      // Fetch userName from DB for display
      const userDoc = await User.findById(userId).select('_id username name email profilePicture').lean();
      if (userDoc) {
        let userName = userDoc.name;
        if (!userName || userName.trim() === '') userName = userDoc.username;
        if (!userName || userName.trim() === '') userName = userDoc.email;
        if (!userName || userName.trim() === '') userName = 'User';
        const profilePicture = userDoc.profilePicture || '';
        onlineUsers.set(userId, { _id: userId, userName, profilePicture, socketId: socket.id });
        console.log('[Socket.IO] User joined and set online:', { _id: userId, userName, profilePicture });
        // Emit online users
        io.emit('onlineUsers', Array.from(onlineUsers.values()));
        io.emit('userOnline', { _id: userId, userName, profilePicture });
        
        // Verify room membership
        const roomMembers = io.sockets.adapter.rooms.get(roomName);
        console.log('[Socket.IO] Room members for', roomName, ':', roomMembers ? Array.from(roomMembers).length : 0, 'sockets');
      } else {
        console.log('[Socket.IO] No user found for userId:', userId);
      }
    } catch (err) {
      console.error('[Socket.IO] Error in join event:', err);
    }
  });

  // Client requests current online users
  socket.on('getOnlineUsers', () => {
    console.log('[Socket.IO] getOnlineUsers request. Current:', Array.from(onlineUsers.values()));
    socket.emit('onlineUsers', Array.from(onlineUsers.values()));
  });

  // Send message event
  socket.on('sendMessage', async ({ conversationId, sender, recipient, message, language }) => {
    try {
      // Get sender user to check suspension/deletion status
      const senderUser = await User.findById(sender);
      if (!senderUser) {
        console.log('[Socket.IO] Sender not found:', sender);
        return;
      }
      
      // Check if user is deleted
      if (senderUser.isDeleted) {
        console.log('[Socket.IO] Attempt to send message from deleted user:', sender);
        io.to(sender).emit('messageBlocked', { 
          reason: 'Account deleted',
          message: 'Your account has been deleted. You cannot send messages.'
        });
        return;
      }
      
      // Check if user is suspended
      if (senderUser.suspendedUntil && senderUser.suspendedUntil > new Date()) {
        const suspensionEndDate = new Date(senderUser.suspendedUntil);
        console.log('[Socket.IO] Attempt to send message from suspended user:', sender);
        io.to(sender).emit('messageBlocked', { 
          reason: 'Account suspended',
          suspendedUntil: suspensionEndDate,
          message: 'Your account is suspended. You cannot send messages until ' + suspensionEndDate.toISOString()
        });
        return;
      }
      
      // Check message against word filter
      const filterResult = checkWordFilter(message, language || 'en');
      
      if (filterResult.isProhibited) {
        console.log(`[Socket.IO] Word filter violation by user ${sender}: matched word "${filterResult.matchedWord}"`);
        
        // Increment violation count
        senderUser.violationCount = (senderUser.violationCount || 0) + 1;
        senderUser.lastViolationDate = new Date();
        
        let warningInfo = '';
        let messageType = 'system_warning';
        
        // Handle based on violation count
        if (senderUser.violationCount === 1) {
          // First violation - just warn
          warningInfo = getWarningMessage('first');
          console.log(`[Socket.IO] First violation for user ${sender}, sending warning`);
        } else {
          // Second violation or more - suspend for 30 days or delete account
          if (senderUser.violationCount === 2) {
            // Second violation - suspend for 30 days
            const suspensionDate = new Date();
            suspensionDate.setDate(suspensionDate.getDate() + 30);
            senderUser.suspendedUntil = suspensionDate;
            warningInfo = getWarningMessage('suspended');
            console.log(`[Socket.IO] Second violation for user ${sender}, suspending until ${suspensionDate}`);
            messageType = 'system_warning';
          } else if (senderUser.violationCount >= 3) {
            // Third+ violation - delete account
            senderUser.isDeleted = true;
            warningInfo = getWarningMessage('deleted');
            console.log(`[Socket.IO] Third+ violation for user ${sender}, deleting account`);
            messageType = 'system_warning';
          }
        }
        
        await senderUser.save();
        
        // Create and save warning message to database with code for client-side translation
        const warningMsg = await ChatMessage.create({
          conversationId,
          sender: null, // null sender indicates system/superadmin
          recipient: sender,
          message: '', // Empty message - client will translate based on warningCode
          messageType: messageType,
          sentAt: new Date(),
          warningCode: warningInfo.code, // Add warning code for translation
          violationCount: warningInfo.violationCount,
          suspensionEnd: warningInfo.suspensionEnd,
          isDeleted: warningInfo.isDeleted
        });
        
        // Update conversation timestamp
        await ChatConversation.findByIdAndUpdate(conversationId, { updatedAt: Date.now() });
        
        // Send warning to sender from superadmin with warning code for translation
        io.to(sender).emit('receiveMessage', { 
          conversationId, 
          sender: null, // null indicates superadmin/system
          message: '', // Empty message - client will translate based on warningCode
          sentAt: warningMsg.sentAt,
          messageType: messageType,
          warningCode: warningInfo.code,
          violationCount: warningInfo.violationCount,
          suspensionEnd: warningInfo.suspensionEnd,
          isDeleted: warningInfo.isDeleted
        });
        
        // Notify sender that message was blocked
        io.to(sender).emit('messageBlocked', { 
          reason: 'Contains prohibited words',
          warningCode: warningInfo.code,
          violationCount: warningInfo.violationCount,
          isSuspended: !!senderUser.suspendedUntil,
          isDeleted: senderUser.isDeleted,
          suspensionEnd: warningInfo.suspensionEnd
        });
        
        // Do NOT send the original message to recipient - it's blocked
        return;
      }
      
      // Message is safe - send it normally
      const msg = await ChatMessage.create({ 
        conversationId, 
        sender, 
        recipient, 
        message,
        sentAt: new Date()
      });
      
      await ChatConversation.findByIdAndUpdate(conversationId, { updatedAt: Date.now() });
      
      // Emit to recipient
      io.to(recipient).emit('receiveMessage', { 
        conversationId, 
        sender, 
        message, 
        sentAt: msg.sentAt 
      });
      
      // Send notification to recipient
      io.to(recipient).emit('notification', { from: sender, message });
    } catch (error) {
      console.error('[Socket.IO] Error in sendMessage:', error);
    }
  });

  // Typing indicator
  socket.on('typing', ({ recipient, sender }) => {
    io.to(recipient).emit('typing', { from: sender });
  });

  // Refresh conversations for both users (block/unblock, etc)
  socket.on('refreshConversations', ({ userId, otherUserId }) => {
    if (userId) io.to(userId).emit('refreshConversations');
    if (otherUserId) io.to(otherUserId).emit('refreshConversations');
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    // Find user by socketId
    const userEntry = Array.from(onlineUsers.entries()).find(([_, v]) => v.socketId === socket.id);
    if (userEntry) {
      const [userId, userObj] = userEntry;
      onlineUsers.delete(userId);
      io.emit('onlineUsers', Array.from(onlineUsers.values()));
      io.emit('userOffline', { _id: userId, userName: userObj.userName });
    }
  });
});

// Graceful error handler for common listen errors
httpServer.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} already in use. Stop the running process or change PORT.`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});