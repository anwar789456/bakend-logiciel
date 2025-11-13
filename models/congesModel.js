const mongoose = require('mongoose');
const { getConnections } = require('../config/db');

const congesSchema = new mongoose.Schema({
    collaborateur: String,
    nbr_jour: String,
    date_debut: Date,
    date_fin: Date,
    nature: String
}, { timestamps: true });

// This model will be initialized after the database connections are established
let Conges;

// Function to initialize the model with the appropriate connection
const initModel = () => {
    const { conn2 } = getConnections();
    if (!Conges && conn2) {
        Conges = conn2.model('conges', congesSchema, 'conges');
    }
    return Conges;
};

// Export both the model initialization function and the model
module.exports = {
    Conges: null, // Will be set by initModel
    initModel: function() {
        const model = initModel();
        this.Conges = model;
        return model;
    }
};
