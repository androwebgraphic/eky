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

  // 3. Set up CORS middleware FIRST (more permissive for development)
  const allowedOrigins = [
    'http://localhost:3000',
    'http://172.20.10.4:3000',
    'https://eky-3xf1.onrender.com'
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
  res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

// If you want to use the auth middleware globally, use ONLY the function, not the module object:
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

// Load User model for socket operations
const User = require('./models/userModel.js');

// --- Online users tracking ---
const onlineUsers = new Map(); // userId -> { _id, userName, socketId }

io.on('connection', (socket) => {
  console.log('[Socket.IO] New connection from:', socket.id);
  console.log('[Socket.IO] Connection handshake origin:', socket.handshake.headers.origin);
  
  // Join user room and register online user
  socket.on('join', async (userId) => {
    console.log('[Socket.IO] join event for userId:', userId);
    socket.join(userId);
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
  socket.on('sendMessage', ({ conversationId, sender, recipient, message }) => {
    io.to(recipient).emit('receiveMessage', { conversationId, sender, message, sentAt: new Date().toISOString() });
    io.to(recipient).emit('notification', { from: sender, message });
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