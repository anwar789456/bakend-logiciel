const mongoose = require('mongoose');
const { getConnections } = require('../config/db');

const bonLivraisonSchema = new mongoose.Schema({
  // Type de client
  clientType: { type: String, enum: ['particulier', 'entreprise'], default: 'particulier' },

  // Informations client
  clientName: { type: String, required: true },
  clientAddress: { type: String, required: true },
  clientPhone: { type: String, required: true },
  email: { type: String },

  // Informations entreprise (uniquement pour type 'entreprise')
  companyName: { type: String },
  rc: { type: String }, // Registre de Commerce
  taxId: { type: String }, // Identifiant fiscal

  // Informations bon de livraison
  bonLivraisonNumber: { type: String, unique: true },
  date: { type: Date, default: Date.now },
  
  // Articles du bon de livraison (sans prix)
  items: [{
    quantity: { type: Number, required: true },
    description: { type: String, required: true },
    refColor: { type: String },
    // Informations sur le produit et l'option sélectionnée
    productId: { type: String },
    reference: { type: String },
    selectedOption: {
      option_name: { type: String },
      prix_option: { type: String }
    }
  }],
  
  // Logo personnalisé
  customLogo: { type: String }, // Chemin vers le logo personnalisé
  
  // Statut et suivi
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'delivered'], default: 'pending' },
  deliveryDate: { type: Date },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

let BonLivraison;

const initModel = () => {
    const { conn2 } = getConnections();
    if (!conn2) {
        console.warn("⚠️ Database connection is not initialized yet. Make sure connectDB() has been called before this.");
        return undefined;
    }
    if (!BonLivraison) {
        BonLivraison = conn2.model('BonLivraison', bonLivraisonSchema, "bonlivraisons");
    }
    return BonLivraison;
};

module.exports = { initModel };
