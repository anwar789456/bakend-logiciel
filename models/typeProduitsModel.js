const mongoose = require('mongoose');
const { getConnections } = require('../config/db');

const typeProduitSchema = new mongoose.Schema({
    title: String,
    sousTitles: [{
        titleSous: String,
        valueSous: String
    }]
});

// This model will be initialized after the database connections are established
let TypeProduit;

// Function to initialize the model with the appropriate connection
const initModel = () => {
    const { conn2 } = getConnections();
    if (!TypeProduit && conn2) {
        TypeProduit = conn2.model('typeProduit', typeProduitSchema, 'typeProduits');
    }
    return TypeProduit;
};

// Export both the model initialization function and the model
module.exports = {
    TypeProduit: null, // Will be set by initModel
    initModel: function() {
        const model = initModel();
        this.TypeProduit = model;
        return model;
    }
};