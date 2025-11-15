const mongoose = require('mongoose');
const { getConnections } = require('../config/db');

const bonCompteurSchema = new mongoose.Schema({
  year: { type: String, required: true },
  comptValue: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now }
});

let BonCompteur;

const initModel = () => {
    const { conn2 } = getConnections();
    if (!conn2) {
        console.warn("⚠️ Database connection is not initialized yet. Make sure connectDB() has been called before this.");
        return undefined;
    }
    if (!BonCompteur) {
        BonCompteur = conn2.model('BonCompteur', bonCompteurSchema, "boncompteurs");
    }
    return BonCompteur;
};

module.exports = { initModel };
