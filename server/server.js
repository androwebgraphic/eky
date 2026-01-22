import express from "express";
import dotenv from "dotenv";
import connectDB from './db/connectDB.js';
import cookieParser from 'cookie-parser';
import passport from './config/passport.js';
import userRoutes from "./routes/userRoutes.js";
import dogRoutes from "./routes/dogRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import cors from 'cors';
console.log("hello");
dotenv.config();
connectDB();

const app = express();
 const PORT = process.env.PORT || 3002;
 
 //MIDDLEWARE
 // (removed duplicate allowedOrigins and related unused code)
// Allow both local and production frontends for CORS

// Allow all origins for CORS (for development and deployment)
app.use(cors({
  origin: 'https://eky-frontend-m2ul.onrender.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
// Health check endpoint for Render.com
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});
 app.use(express.json({ limit: '100mb' }));//to parse  Json data in the req.body
import chatRoutes from './routes/chatRoutes.js';
app.use(express.urlencoded({ limit: '100mb', extended: true })); //to parse form data in the req.body
app.use(cookieParser());

// Initialize Passport
app.use(passport.initialize());

app.use('/api/chat', chatRoutes);

// Serve legacy uploads with CORS headers for images still on disk
app.use('/uploads', cors({ origin: '*' }), express.static('uploads'));

// User and other API routes
app.use("/api/users", userRoutes);
app.use("/api/dogs", dogRoutes)
app.use("/api/auth", authRoutes)
 
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

    app.use(cors({
      origin: function(origin, callback) {
        // allow requests with no origin (like mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        } else {
          return callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true
    }));
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