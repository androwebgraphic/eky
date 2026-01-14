import express from "express";
import dotenv from "dotenv";
import connectDB from './db/connectDB.js';
import cookieParser from 'cookie-parser';
import passport from './config/passport.js';
import userRoutes from "./routes/userRoutes.js"
import dogRoutes from "./routes/dogRoutes.js"
import authRoutes from "./routes/authRoutes.js"
import cors from 'cors'

dotenv.config();

connectDB();

 const app = express();
 const PORT = process.env.PORT || 3001;
 
 //MIDDLEWARE
 // Allow the configured client origin(s) or accept localhost and LAN dev origins
 const clientOriginEnv = process.env.CLIENT_ORIGIN || '';
 const allowedOrigins = clientOriginEnv ? clientOriginEnv.split(',').map(s => s.trim()) : [];
 // Regex to match typical LAN/private IP ranges (10.x.x.x, 172.16-31.x.x, 192.168.x.x)
 const lanOriginRegex = /^https?:\/\/(?:localhost|127\.0\.0\.1|10(?:\.\d{1,3}){3}|172\.(?:1[6-9]|2[0-9]|3[0-1])(?:\.\d{1,3}){2}|192\.168(?:\.\d{1,3}){2})(:\d+)?$/;
 app.use(cors({
   origin: function(origin, callback) {
     // allow non-browser requests (curl, server-to-server)
     if (!origin) return callback(null, true);
     // debug logging can be enabled via environment if needed
     // allow configured origins
     if (allowedOrigins.includes(origin)) return callback(null, true);
     // allow any localhost or LAN IP (developer convenience)
     if (lanOriginRegex.test(origin)) return callback(null, true);
     return callback(new Error('Not allowed by CORS'));
   }
 }));
 app.use(express.json({ limit: '100mb' }));//to parse  Json data in the req.body
import chatRoutes from './routes/chatRoutes.js';
 app.use(express.urlencoded({ limit: '100mb', extended: true })); //to parse form data in the req.body
 app.use(cookieParser());
 
 // Initialize Passport
 app.use(passport.initialize());
 

app.use('/api/chat', chatRoutes);

 // serve uploaded media
 app.use('/uploads', express.static('uploads'));
 

// User and other API routes
app.use("/api/users", userRoutes);
app.use("/api/dogs", dogRoutes)
app.use("/api/auth", authRoutes)

 
 // Simple health check endpoint
 app.get('/health', (req, res) => {
   res.json({ status: 'ok', uptime: process.uptime() });
 });
 
 // Start server after all middleware and routes are set up

const httpServer = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started at:`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://172.20.10.2:${PORT}`);
});

// Socket.IO setup
import { Server as SocketIOServer } from 'socket.io';
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// --- Online users tracking ---
const onlineUsers = new Map(); // userId -> { _id, userName, socketId }

io.on('connection', (socket) => {
  // Join user room and register online user
  socket.on('join', (userId) => {
    console.log('[Socket.IO] join event for userId:', userId);
    socket.join(userId);
    // Fetch userName from DB for display (async)
    import('./models/userModel.js').then(({ default: User }) => {
      User.findById(userId).select('_id username name email').then(userDoc => {
        if (userDoc) {
          let userName = userDoc.name;
          if (!userName || userName.trim() === '') userName = userDoc.username;
          if (!userName || userName.trim() === '') userName = userDoc.email;
          if (!userName || userName.trim() === '') userName = 'User';
          onlineUsers.set(userId, { _id: userId, userName, socketId: socket.id });
          console.log('[Socket.IO] User joined and set online:', { _id: userId, userName });
          // Notify all clients
          io.emit('onlineUsers', Array.from(onlineUsers.values()));
          io.emit('userOnline', { _id: userId, userName });
        } else {
          console.log('[Socket.IO] No user found for userId:', userId);
        }
      });
    });
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
 
 // Set higher header size limits to prevent 431 errors
 httpServer.maxHeaderSize = 16 * 1024; // 16KB for headers