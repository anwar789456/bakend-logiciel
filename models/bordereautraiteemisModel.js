const mongoose = require('mongoose');
const { getConnections } = require('../config/db');

const bordereautraiteemisSchema = new mongoose.Schema({
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
let Bordereautraiteemis;

// Function to initialize the model with the appropriate connection
const initModel = () => {
    const { conn2 } = getConnections();
    if (!Bordereautraiteemis && conn2) {
        Bordereautraiteemis = conn2.model('bordereautraiteemis', bordereautraiteemisSchema, 'bordereautraiteemis');
    }
    return Bordereautraiteemis;
};

// Export both the model initialization function and the model
module.exports = {
    Bordereautraiteemis: null, // Will be set by initModel
    initModel: function() {
        const model = initModel();
        this.Bordereautraiteemis = model;
        return model;
    }
};
