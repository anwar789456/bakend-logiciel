const express = require('express');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
dotenv.config();
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const ProductRouter = require('./routes/productRoutes');
const CommandeRouter = require('./routes/commandeRouter');
const messageRouter = require('./routes/messageRouter');
const DevisRouter = require('./routes/devisRoutes');
const DevisCompteurRouter = require('./routes/devisCompteurRouter');
const initChangeStreams = require('./initChangeStreams');

const app = express();
app.use(cors());
const PORT = process.env.PORT;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  path: '/admin/socket.io',
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});


// Make io accessible throughout the app
app.set('io', io);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Middleware
app.use(express.json());

// Database Connection and Initialize Change Streams
connectDB().then((connections) => {
  console.log('Successfully connected to database');
  initChangeStreams(io);
}).catch(err => {
  console.error('Failed to connect to database:', err);
});

// Routes
app.use(ProductRouter);
app.use(CommandeRouter);
app.use(messageRouter);
app.use(DevisRouter);
app.use(DevisCompteurRouter);

// Start Server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// Export io instance for use in other modules
module.exports = { io };