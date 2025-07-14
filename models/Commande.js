const mongoose = require('mongoose');
const { getConnections } = require('../config/db');

const cartItemSchema = new mongoose.Schema({
  idItem: String,
  idProd: String,
  quantity: { type: Number },
  totalPrice: { type: Number },
  selectedOptionTissue: { option_name: String, prix_option: String, },
  selectedOptionDimension: {
    longueur: String,
    largeur: String,
    prix_option: String,
    prix_coffre: String,
  },
  selectedOptionCoffre: String,
  directionCanapeAngle: String,
});

const commandeSchema = new mongoose.Schema({
  nomPrenom: { type: String },
  pays: { type: String },
  gouvernorat: { type: String },
  email: { type: String },
  telephone: { type: String },
  comments: { type: String, default: '' },
  cartItems: [cartItemSchema],
  createdAt : { type: Date }
});

// This model will be initialized after the database connections are established
let Commande;

// Function to initialize the model with the appropriate connection
const initModel = () => {
    const { conn1 } = getConnections();
    if (!Commande && conn1) {
        Commande = conn1.model('Commande', commandeSchema, "commandes");
    }
    return Commande;
};

// Export both the model initialization function and the model
module.exports = {
    Commande: null, // Will be set by initModel
    initModel: function() {
        const model = initModel();
        this.Commande = model;
        return model;
    }
};
