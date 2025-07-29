const mongoose = require('mongoose');
const { getConnections } = require('../config/db');

const ficheCommandeSchema = new mongoose.Schema({
  num: { type: Number, required: true },
  client: { type: String, required: true },
  numero_tel: { type: String },
  modele: { type: String, required: true },
  couleur: { type: String },
  prix: { type: Number, required: true },
  date_commande: { type: Date },
  avance: { type: Number },
  nature_avance: { type: String },
  reglement: { type: Number },
  nature_reglement: { type: String },
  reste: { type: Number },
  cout: { type: Number },
  mb: { type: Number },
  date_livraison_prevu: { type: Date },
  date_livraison_effective: { type: Date },
}, { timestamps: true });

// This model will be initialized after the database connection is established
let FicheCommande;

// Function to initialize the model with the appropriate connection
const initModel = () => {
    const { conn2 } = getConnections();
    if (!FicheCommande && conn2) {
        FicheCommande = conn2.model('FicheCommande', ficheCommandeSchema, 'ficheCommandes');
    }
    return FicheCommande;
};

// Export both the model initialization function and the model
module.exports = {
    FicheCommande: null, // Will be set by initModel
    initModel: function() {
        const model = initModel();
        this.FicheCommande = model;
        return model;
    }
};