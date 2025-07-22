const mongoose = require('mongoose');
const { getConnections } = require('../config/db');

const devisSchema = new mongoose.Schema({
  clientName: { type: String },
  email: { type: String },
  phone: { type: String },
  description: { type: String },
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

let Devis;

const initModel = () => {
    const { conn1 } = getConnections();
    if (!Devis && conn1) {
        Devis = conn1.model('Devis', devisSchema, "devis");
    }
    return Devis;
};

module.exports = {
    Devis: null,
    initModel: function() {
        const model = initModel();
        this.Devis = model;
        return model;
    }
};