const mongoose = require('mongoose');
const { getConnections } = require('../config/db');

const factureCompteurSchema = new mongoose.Schema({
  factureComptValue: { type: String, required: true },
  datefacturecompt: { type: Date, default: Date.now }
});

let FactureCompteur;

const initModel = () => {
    const { conn2 } = getConnections();
    if (!conn2) {
        console.warn("⚠️ Database connection is not initialized yet. Make sure connectDB() has been called before this.");
        return undefined;
    }
    if (!FactureCompteur) {
        FactureCompteur = conn2.model('FactureCompteur', factureCompteurSchema, "facturecompteur");
    }
    return FactureCompteur;
};

module.exports = { initModel };
