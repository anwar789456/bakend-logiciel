const mongoose = require('mongoose');
const { getConnections } = require('../config/db');

const devisSchema = new mongoose.Schema({
  // Type de devis
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

  // Informations devis
  devisNumber: { type: String, unique: true },
  date: { type: Date, default: Date.now },
  validityDate: { type: Date },
  
  // Articles du devis
  items: [{
    quantity: { type: Number, required: true },
    description: { type: String, required: true },
    refColor: { type: String },
    unitPrice: { type: Number, required: true },
    basePrice: { type: Number, default: 0 }, // Prix de base sans option
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    // Informations sur le produit et l'option sélectionnée
    productId: { type: String },
    reference: { type: String },
    selectedOption: {
      option_name: { type: String },
      prix_option: { type: String }
    }
  }],
  
  // Totaux
  subtotal: { type: Number, required: true },
  totalDiscount: { type: Number, default: 0 },
  totalHT: { type: Number, required: true }, // Total Hors Taxes
  tvaRate: { type: Number, default: 19 }, // Taux TVA en %
  tvaAmount: { type: Number, default: 0 }, // Montant TVA
  totalTTC: { type: Number, required: true }, // Total TTC (avec TVA)
  totalAmount: { type: Number, required: true }, // Montant final (TTC pour entreprise, HT pour particulier)
  
  // Conditions
  deliveryDelay: { type: String, default: '45 jours à partir de la date de confirmation' },
  paymentTerms: { type: String, default: 'Tous les paiements sont effectués avant la livraison au showroom' },
  deliveryCondition: { type: String, default: 'LA LIVRAISON EST GRATUITE UNIQUEMENT SUR LE GRAND TUNIS (TUNIS, ARIANA, MANOUBA, BEN AROUS)' },
  
  // Logo personnalisé
  customLogo: { type: String }, // Chemin vers le logo personnalisé
  
  // Statut et suivi
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'draft', 'sent', 'accepted', 'rejected', 'expired'], default: 'pending' },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

let Devis;

const initModel = () => {
    const { conn2 } = getConnections();
    if (!conn2) {
        console.warn("⚠️ Database connection is not initialized yet. Make sure connectDB() has been called before this.");
        return undefined;
    }
    if (!Devis) {
        Devis = conn2.model('Devis', devisSchema, "devis");
    }
    return Devis;
};

module.exports = { initModel };