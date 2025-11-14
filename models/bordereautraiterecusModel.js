const mongoose = require('mongoose');
const { getConnections } = require('../config/db');

const bordereautraiterecusSchema = new mongoose.Schema({
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
let Bordereautraiterecus;

// Function to initialize the model with the appropriate connection
const initModel = () => {
    const { conn2 } = getConnections();
    if (!Bordereautraiterecus && conn2) {
        Bordereautraiterecus = conn2.model('bordereautraiterecus', bordereautraiterecusSchema, 'bordereautraiterecus');
    }
    return Bordereautraiterecus;
};

// Export both the model initialization function and the model
module.exports = {
    Bordereautraiterecus: null, // Will be set by initModel
    initModel: function() {
        const model = initModel();
        this.Bordereautraiterecus = model;
        return model;
    }
};
