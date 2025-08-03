const mongoose = require('mongoose');
const { getConnections } = require('../config/db');

const devisSchema = new mongoose.Schema({
  // Informations client
  clientName: { type: String, required: true },
  clientAddress: { type: String, required: true },
  clientPhone: { type: String, required: true },
  email: { type: String },
  
  // Informations devis
  devisNumber: { type: String, unique: true },
  date: { type: Date, default: Date.now },
  validityDate: { type: Date },
  
  // Articles du devis
  items: [{
    quantity: { type: Number, required: true },
    description: { type: String, required: true },
    reference: { type: String },
    color: { type: String },
    unitPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true }
  }],
  
  // Totaux
  subtotal: { type: Number, required: true },
  totalDiscount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  
  // Conditions
  deliveryDelay: { type: String, default: '45 jours à partir de la date de confirmation' },
  paymentTerms: { type: String, default: 'Tous les paiements sont effectués avant la livraison au showroom' },
  deliveryCondition: { type: String, default: 'LA LIVRAISON EST GRATUITE UNIQUEMENT SUR LE GRAND TUNIS (TUNIS, ARIANA, MANOUBA, BEN AROUS)' },
  
  // Statut et suivi
  status: { type: String, enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'], default: 'draft' },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

let Devis;

const initModel = () => {
    const { conn2 } = getConnections();
    if (!Devis && conn2) {
        Devis = conn2.model('Devis', devisSchema, "devis");
    }
    return Devis;
};

module.exports = {
    Devis: null,
    initModel: function() {
        const model = initModel();
        this.Devis = model;
        return model;
    }
};