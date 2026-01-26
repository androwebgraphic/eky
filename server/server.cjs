
const express = require("express");
const http = require('http');
const dotenv = require("dotenv");
const connectDB = require('./db/connectDB.js');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport.js');
const userRoutes = require("./routes/userRoutes.js");
const dogRoutes = require("./routes/dogRoutes.js");
const authRoutes = require("./routes/authRoutes.js");
const cors = require('cors');
const chatRoutes = require('./routes/chatRoutes.js'); // <-- Add this here

// 2. Create the Express app FIRST

const app = express();

// 3. Set up middleware AFTER app is created
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});
// 4. Load environment variables
dotenv.config({ path: '.env' });

// 5. Connect to DB
connectDB();



// 7. Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime() });
});

// 8. Set up body parsers
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(cookieParser());

// 9. Initialize Passport
app.use(passport.initialize());

// 10. Use routes
app.use('/api/chat', chatRoutes);
app.use('/u', cors({ origin: '*' }), express.static('uploads'));
app.use("/api/users", userRoutes);
app.use("/api/dogs", dogRoutes);
app.use("/api/auth", authRoutes);

// ... rest of your Socket.IO code

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});
 
 // Start server after all middleware and routes are set up

const PORT = process.env.PORT || 3001;
const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://172.20.10.2:3000', 'http://localhost:3002', 'http://127.0.0.1:3002', 'http://172.20.10.2:3002'];
const httpServer = http.createServer({ maxHeaderSize: 1024 * 1024 }, app);
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server started at:`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://172.20.10.2:${PORT}`);
});

const { Server: SocketIOServer } = require('socket.io');
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: function(origin, callback) {
      // allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST']
  }
});

const { setIo } = require('./socket.js');
setIo(io);

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