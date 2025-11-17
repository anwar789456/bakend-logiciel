const mongoose = require('mongoose');
const { getConnections } = require('../config/db');

const bonReceptionCompteurSchema = new mongoose.Schema({
  year: { type: String },
  comptValue: { type: String },
  updatedAt: { type: Date, default: Date.now }
});

let BonReceptionCompteur;

const initModel = () => {
    const { conn2 } = getConnections();
    if (!conn2) {
        console.warn("⚠️ Database connection is not initialized yet. Make sure connectDB() has been called before this.");
        return undefined;
    }
    if (!BonReceptionCompteur) {
        BonReceptionCompteur = conn2.model('BonReceptionCompteur', bonReceptionCompteurSchema, "bonreceptioncompteurs");
    }
    return BonReceptionCompteur;
};

module.exports = { initModel };
