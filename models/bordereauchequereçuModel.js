const mongoose = require('mongoose');
const { getConnections } = require('../config/db');

const bordereauchequereçuSchema = new mongoose.Schema({
    emetteur: String,
    num_cheque: String,
    tel: String,
    banque: String,
    montant: String,
    date_emission: Date,
    echeance: Date,
    ordre_de: String,
    lieu: String
}, { timestamps: true });

// This model will be initialized after the database connections are established
let Bordereauchequereçu;

// Function to initialize the model with the appropriate connection
const initModel = () => {
    const { conn2 } = getConnections();
    if (!Bordereauchequereçu && conn2) {
        Bordereauchequereçu = conn2.model('bordereauchequereçu', bordereauchequereçuSchema, 'bordereauchequereçus');
    }
    return Bordereauchequereçu;
};

// Export both the model initialization function and the model
module.exports = {
    Bordereauchequereçu: null, // Will be set by initModel
    initModel: function() {
        const model = initModel();
        this.Bordereauchequereçu = model;
        return model;
    }
};
