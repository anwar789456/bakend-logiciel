const mongoose = require('mongoose');
const { getConnections } = require('../config/db');

const bonCommandeFournisseurSchema = new mongoose.Schema({
  fournisseur: { type: String },
  adresse: { type: String },
  gsm: { type: String },
  compteur: { type: String },
  date_bon: { type: Date },
  
  articles: [{
    description: { type: String },
    quantity: { type: String },
    pu_ht: { type: String },
    pht: { type: String },
    pu_ttc: { type: String },
    ref_couleur: { type: String }
  }],
  
  avance: { type: String },
  reglement: { type: String },
  
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
