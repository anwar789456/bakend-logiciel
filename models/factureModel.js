const mongoose = require('mongoose');
const { getConnections } = require('../config/db');

const factureSchema = new mongoose.Schema({
  // Type de facture
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

  // Informations facture
  factureNumber: { type: String, unique: true },
  date: { type: Date, default: Date.now },
  
  // Articles de la facture
  items: [{
    quantity: { type: Number, required: true },
    description: { type: String, required: true },
    refColor: { type: String },
    unitPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true }
  }],
  
  // Totaux
  subtotal: { type: Number, required: true },
  totalDiscount: { type: Number, default: 0 },
  totalHT: { type: Number, required: true }, // Total Hors Taxes
  tvaRate: { type: Number, default: 19 }, // Taux TVA en %
  tvaAmount: { type: Number, default: 0 }, // Montant TVA
  totalTTC: { type: Number, required: true }, // Total TTC (avec TVA)
  totalAmount: { type: Number, required: true }, // Montant final (TTC pour entreprise, HT pour particulier)
  
  // Logo personnalisé
  customLogo: { type: String }, // Chemin vers le logo personnalisé
  
  // Statut et suivi
  status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'paid', 'unpaid', 'partial'], default: 'pending' },
  paymentDate: { type: Date },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

let Facture;

const initModel = () => {
    const { conn2 } = getConnections();
    if (!conn2) {
        console.warn("⚠️ Database connection is not initialized yet. Make sure connectDB() has been called before this.");
        return undefined;
    }
    if (!Facture) {
        Facture = conn2.model('Facture', factureSchema, "factures");
    }
    return Facture;
};

module.exports = { initModel };
