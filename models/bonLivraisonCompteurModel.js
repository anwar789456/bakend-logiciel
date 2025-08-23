const mongoose = require('mongoose');
const { getConnections } = require('../config/db');

const bonLivraisonCompteurSchema = new mongoose.Schema({
  bonLivraisonComptValue: { type: String, required: true },
  datebonlivraisoncompt: { type: Date, default: Date.now }
});

let BonLivraisonCompteur;

const initModel = () => {
    const { conn2 } = getConnections();
    if (!conn2) {
        console.warn("⚠️ Database connection is not initialized yet. Make sure connectDB() has been called before this.");
        return undefined;
    }
    if (!BonLivraisonCompteur) {
        BonLivraisonCompteur = conn2.model('BonLivraisonCompteur', bonLivraisonCompteurSchema, "bonlivraisoncompteurs");
    }
    return BonLivraisonCompteur;
};

module.exports = { initModel };
