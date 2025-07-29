// Import model initialization functions
const productModel = require('./models/productModel');
const chatModel = require('./models/messagerieModel');
const commandeModel = require('./models/Commande');
const devisModel = require('./models/devisModel');
const devisCompteurModel = require('./models/devisCompteurModel');
const ficheCommandeModel = require('./models/ficheCommandes');
const { setupChangeStream } = require('./changeStream');

const initChangeStreams = async (io) => {
  try {
    console.log('Setting up MongoDB change streams...');

    // Ensure models are initialized with their respective connections
    const Product = productModel.initModel ? productModel.initModel() : productModel;
    const Chat = chatModel.initModel ? chatModel.initModel() : chatModel;
    const Devis = devisModel.initModel ? devisModel.initModel() : devisModel;
    const DevisCompteur = devisCompteurModel.initModel ? devisCompteurModel.initModel() : devisCompteurModel;
    const FicheCommande = ficheCommandeModel.initModel ? ficheCommandeModel.initModel() : ficheCommandeModel;
    
    // Pass io to each setupChangeStream call
    await setupChangeStream(Product, 'produits-updated', io);
    await setupChangeStream(Chat, 'chatlogs-updated', io);
    await setupChangeStream(Devis, 'devis-updated', io);
    await setupChangeStream(DevisCompteur, 'devisCompteur-updated', io);
    await setupChangeStream(FicheCommande, 'ficheCommandes-updated', io);

    console.log('Change streams initialized successfully');
  } catch (error) {
    console.error('Failed to initialize change streams:', error);
  }
};

module.exports = initChangeStreams;
