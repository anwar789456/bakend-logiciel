const mongoose = require('mongoose');
const { getConnections } = require('../config/db');

const reglementSchema = new mongoose.Schema({
  date_operation: { type: Date },
  libele: { type: String },
  debit: { type: String },
  credit: { type: String },
  solde: { type: String }
}, { _id: false });

const etatReglementsFournisseurSchema = new mongoose.Schema({
  fournisseur: { type: String },
  reglements: [reglementSchema]
}, { timestamps: true });

let EtatReglementsFournisseur;

const initModel = () => {
    const { conn2 } = getConnections();
    if (!conn2) {
        console.warn("⚠️ Database connection is not initialized yet. Make sure connectDB() has been called before this.");
        return undefined;
    }
    if (!EtatReglementsFournisseur) {
        EtatReglementsFournisseur = conn2.model('EtatReglementsFournisseur', etatReglementsFournisseurSchema, "etatreglementsfournisseurs");
    }
    return EtatReglementsFournisseur;
};

module.exports = { initModel };
