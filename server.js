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
const FactureRouter = require('./routes/factureRoutes');
const FactureCompteurRouter = require('./routes/factureCompteurRouter');
const BonLivraisonCompteurRouter = require('./routes/bonLivraisonCompteurRouter');
const RecuPaiementCompteurRouter = require('./routes/recuPaiementCompteurRouter');
const BackupRouter = require('./routes/backupRoutes');
const StatsRouter = require('./routes/statsRoutes');
const AIAssistantRouter = require('./routes/aiAssistantRoutes');
const TypeProduitRouter = require('./routes/typeProduitRoutes');
const CaisseRouter = require('./routes/caisseRoutes');
const UserRouter = require('./routes/userRoutes');
const DemandeCongeRouter = require('./routes/demandeCongeRoutes');
const EmployeeRouter = require('./routes/employeeRoutes');
const AgendaRouter = require('./routes/agendaRoutes');
const CongesRouter = require('./routes/congesRoutes');
const BonLivraisonRouter = require('./routes/bonLivraisonRoutes');
const RecuPaiementRouter = require('./routes/recuPaiementRoutes');
const FicheCommandeRouter = require('./routes/ficheCommandeRoutes');
const BannerAdvertisementRouter = require('./routes/bannerAdvertisementRoutes');
const BordereauchequeRouter = require('./routes/bordereauchequeRoutes');
const EchancierchequeemisRouter = require('./routes/echancierchequeemisRoutes');
const BordereauchequereçuRouter = require('./routes/bordereauchequereçuRoutes');
const BordereautraiteemisRouter = require('./routes/bordereautraiteemisRoutes');
const BordereautraiterecusRouter = require('./routes/bordereautraiterecusRoutes');
const EchancierchequerecusRouter = require('./routes/echancierchequerecusRoutes');
const EncoursproductionRouter = require('./routes/encoursproductionRoutes');
const BonCommandeFournisseurRouter = require('./routes/bonCommandeFournisseurRoutes');
const BonCompteurRouter = require('./routes/bonCompteurRouter');
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
app.use('/admin/api/logiciel', DevisRouter);
app.use(DevisCompteurRouter);
app.use('/admin/api/logiciel', FactureRouter);
app.use('/admin/api/logiciel', FactureCompteurRouter);
app.use(BonLivraisonCompteurRouter);
app.use(RecuPaiementCompteurRouter);
app.use('/admin/api/logiciel/backup', BackupRouter);
app.use('/admin/api/logiciel/stats', StatsRouter);
app.use('/admin/api/logiciel/ai', AIAssistantRouter);
app.use(TypeProduitRouter);
app.use(CaisseRouter);
app.use(UserRouter);
app.use(DemandeCongeRouter);
app.use(EmployeeRouter);
app.use(AgendaRouter);
app.use(CongesRouter);
app.use('/admin/api/logiciel', BonLivraisonRouter);
app.use('/admin/api/logiciel', RecuPaiementRouter);
app.use('/admin/api/logiciel/fichecommande', FicheCommandeRouter);
app.use(BannerAdvertisementRouter);
app.use(BordereauchequeRouter);
app.use(EchancierchequeemisRouter);
app.use(BordereauchequereçuRouter);
app.use(BordereautraiteemisRouter);
app.use(BordereautraiterecusRouter);
app.use(EchancierchequerecusRouter);
app.use(EncoursproductionRouter);
app.use(BonCommandeFournisseurRouter);
app.use(BonCompteurRouter);

// Start Server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// Export io instance for use in other modules
module.exports = { io };