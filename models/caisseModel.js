const mongoose = require('mongoose');
const { getConnections } = require('../config/db');

const caisseSchema = new mongoose.Schema({
    name: String,
    montant: String,
    solde_depart: String,
    note: String,
    datetransaction: { type: Date },
    transactiontype: String
}, { timestamps: true });

// This model will be initialized after the database connections are established
let Caisse;

// Function to initialize the model with the appropriate connection
const initModel = () => {
    const { conn2 } = getConnections();
    if (!Caisse && conn2) {
        Caisse = conn2.model('caisse', caisseSchema, 'caisse');
    }
    return Caisse;
};

// Export both the model initialization function and the model
module.exports = {
    Caisse: null, // Will be set by initModel
    initModel: function() {
        const model = initModel();
        this.Caisse = model;
        return model;
    }
};