const mongoose = require('mongoose');
const { getConnections } = require('../config/db');

const echancierchequeemisSchema = new mongoose.Schema({
    beneficiaire: String,
    num_cheque: String,
    motif: String,
    montant: String,
    date_emission: Date,
    echeance: Date,
    etat: String
}, { timestamps: true });

// This model will be initialized after the database connections are established
let Echancierchequeemis;

// Function to initialize the model with the appropriate connection
const initModel = () => {
    const { conn2 } = getConnections();
    if (!Echancierchequeemis && conn2) {
        Echancierchequeemis = conn2.model('echancierchequeemis', echancierchequeemisSchema, 'echancierchequeemis');
    }
    return Echancierchequeemis;
};

// Export both the model initialization function and the model
module.exports = {
    Echancierchequeemis: null, // Will be set by initModel
    initModel: function() {
        const model = initModel();
        this.Echancierchequeemis = model;
        return model;
    }
};
