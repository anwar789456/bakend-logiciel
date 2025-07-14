const mongoose = require('mongoose');
const { getConnections } = require('../config/db');

const devisSchema = new mongoose.Schema({
  // Define your schema fields here
  // This is a placeholder schema - update with actual fields
  clientName: { type: String },
  email: { type: String },
  phone: { type: String },
  description: { type: String },
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

// This model will be initialized after the database connections are established
let Devis;

// Function to initialize the model with the appropriate connection
const initModel = () => {
    const { conn1 } = getConnections();
    if (!Devis && conn1) {
        Devis = conn1.model('Devis', devisSchema, "devis");
    }
    return Devis;
};

// Export both the model initialization function and the model
module.exports = {
    Devis: null, // Will be set by initModel
    initModel: function() {
        const model = initModel();
        this.Devis = model;
        return model;
    }
};