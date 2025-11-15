const mongoose = require('mongoose');
const { getConnections } = require('../config/db');

const encoursproductionSchema = new mongoose.Schema({
    clientname: String,
    modeles: [{
        quantity: String,
        modele: String,
        couleur: String,
        metrage: String,
        controle: String
    }],
    date_commande: Date,
    delais_client: Date,
    delais_production: Date
}, { timestamps: true });

// This model will be initialized after the database connections are established
let Encoursproduction;

// Function to initialize the model with the appropriate connection
const initModel = () => {
    const { conn2 } = getConnections();
    if (!Encoursproduction && conn2) {
        Encoursproduction = conn2.model('encoursproduction', encoursproductionSchema, 'encoursproduction');
    }
    return Encoursproduction;
};

// Export both the model initialization function and the model
module.exports = {
    Encoursproduction: null, // Will be set by initModel
    initModel: function() {
        const model = initModel();
        this.Encoursproduction = model;
        return model;
    }
};
