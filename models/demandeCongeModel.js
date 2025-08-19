const mongoose = require('mongoose');
const { getConnections } = require('../config/db');

const demandeCongeSchema = new mongoose.Schema({
    username: String,
    job: String,
    motif: String,
    dateRange: {
        startDate: { type: Date },
        endDate: { type: Date }
    },
    responsable: String,
    date_effectuer: Date,
    decisionResponsable: String
}, { timestamps: true });

// This model will be initialized after the database connections are established
let DemandeConge;

// Function to initialize the model with the appropriate connection
const initModel = () => {
    const { conn2 } = getConnections();
    if (!DemandeConge && conn2) {
        DemandeConge = conn2.model('demandeConge', demandeCongeSchema, 'demandeConges');
    }
    return DemandeConge;
};

// Export both the model initialization function and the model
module.exports = {
    DemandeConge: null, // Will be set by initModel
    initModel: function() {
        const model = initModel();
        this.DemandeConge = model;
        return model;
    }
};