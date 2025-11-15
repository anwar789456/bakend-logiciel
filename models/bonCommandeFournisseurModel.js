const mongoose = require('mongoose');
const { getConnections } = require('../config/db');

const bonCommandeFournisseurSchema = new mongoose.Schema({
  fournisseur: { type: String, required: true },
  adresse: { type: String, required: true },
  gsm: { type: String, required: true },
  compteur: { type: String, unique: true },
  date_bon: { type: Date, default: Date.now },
  
  articles: [{
    description: { type: String, required: true },
    quantity: { type: String, required: true },
    pu_ht: { type: String, required: true },
    pht: { type: String, required: true },
    pu_ttc: { type: String, required: true }
  }],
  
  avance: { type: String, default: '0' },
  reglement: { type: String, default: '0' },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

let BonCommandeFournisseur;

const initModel = () => {
    const { conn2 } = getConnections();
    if (!conn2) {
        console.warn("⚠️ Database connection is not initialized yet. Make sure connectDB() has been called before this.");
        return undefined;
    }
    if (!BonCommandeFournisseur) {
        BonCommandeFournisseur = conn2.model('BonCommandeFournisseur', bonCommandeFournisseurSchema, "boncommandefournisseurs");
    }
    return BonCommandeFournisseur;
};

module.exports = { initModel };
