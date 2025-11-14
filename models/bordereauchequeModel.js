const mongoose = require('mongoose');
const { getConnections } = require('../config/db');

const bordereauchequeSchema = new mongoose.Schema({
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
let Bordereaucheque;

// Function to initialize the model with the appropriate connection
const initModel = () => {
    const { conn2 } = getConnections();
    if (!Bordereaucheque && conn2) {
        Bordereaucheque = conn2.model('bordereaucheque', bordereauchequeSchema, 'bordereaucheques');
    }
    return Bordereaucheque;
};

// Export both the model initialization function and the model
module.exports = {
    Bordereaucheque: null, // Will be set by initModel
    initModel: function() {
        const model = initModel();
        this.Bordereaucheque = model;
        return model;
    }
};
