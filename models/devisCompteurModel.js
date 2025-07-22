const mongoose = require('mongoose');
const { getConnections } = require('../config/db');

const devisCompteurSchema = new mongoose.Schema({
  devisComptValue: { type: String, default: '1' },
  datedeviscompt: { type: Date, default: Date.now }
});

let DevisCompteur;

const initModel = () => {
    const { conn1 } = getConnections();
    if (!DevisCompteur && conn1) {
        DevisCompteur = conn1.model('DevisCompteur', devisCompteurSchema, "devisCompteur");
    }
    return DevisCompteur;
};

module.exports = {
    DevisCompteur: null,
    initModel: function() {
        const model = initModel();
        this.DevisCompteur = model;
        return model;
    }
};