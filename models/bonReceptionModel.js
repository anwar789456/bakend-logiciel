const mongoose = require('mongoose');
const { getConnections } = require('../config/db');

const bonReceptionSchema = new mongoose.Schema({
  fournisseur: { type: String },
  adresse: { type: String },
  gsm: { type: String },
  compteur: { type: String },
  
  articles: [{
    description: { type: String },
    ref_couleur: { type: String },
    quantity: { type: String },
    pu_ht: { type: String },
    remise: { type: String }
  }],
  
  avance: { type: String },
  reglement: { type: String },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

let BonReception;

const initModel = () => {
    const { conn2 } = getConnections();
    if (!conn2) {
        console.warn("⚠️ Database connection is not initialized yet. Make sure connectDB() has been called before this.");
        return undefined;
    }
    if (!BonReception) {
        BonReception = conn2.model('BonReception', bonReceptionSchema, "bonreceptions");
    }
    return BonReception;
};

module.exports = { initModel };
