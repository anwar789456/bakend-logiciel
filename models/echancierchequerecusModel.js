const mongoose = require('mongoose');
const { getConnections } = require('../config/db');

const echancierchequerecusSchema = new mongoose.Schema({
    beneficiaire: String,
    num_cheque: String,
    motif: String,
    montant: String,
    date_emission: Date,
    echeance: Date,
    etat: String
}, { timestamps: true });

// This model will be initialized after the database connections are established
let Echancierchequerecus;

// Function to initialize the model with the appropriate connection
const initModel = () => {
    const { conn2 } = getConnections();
    if (!Echancierchequerecus && conn2) {
        Echancierchequerecus = conn2.model('echancierchequerecus', echancierchequerecusSchema, 'echancierchequerecus');
    }
    return Echancierchequerecus;
};

// Export both the model initialization function and the model
module.exports = {
    Echancierchequerecus: null, // Will be set by initModel
    initModel: function() {
        const model = initModel();
        this.Echancierchequerecus = model;
        return model;
    }
};
