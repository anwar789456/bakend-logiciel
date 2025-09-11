const mongoose = require('mongoose');

const recuPaiementSchema = new mongoose.Schema({
  recuPaiementNumber: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  clientName: {
    type: String,
    required: true
  },
  clientAddress: {
    type: String,
    required: true
  },
  clientPhone: {
    type: String,
    required: true
  },
  clientEmail: {
    type: String
  },
  commandeNumber: {
    type: String,
    required: true
  },
  items: [{
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    description: {
      type: String,
      required: true
    },
    refColor: {
      type: String,
      default: ''
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    basePrice: {
      type: Number,
      default: 0,
      min: 0
    }, // Prix de base sans option
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    total: {
      type: Number,
      required: true,
      min: 0
    },
    // Informations sur le produit et l'option sélectionnée
    productId: { type: String },
    reference: { type: String },
    selectedOption: {
      option_name: { type: String },
      prix_option: { type: String }
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  avance: {
    type: Number,
    default: 0,
    min: 0
  },
  reglement: {
    type: Number,
    required: true,
    min: 0
  },
  resteAPayer: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryDate: {
    type: Date,
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  // Logo personnalisé
  customLogo: { type: String }, // Chemin vers le logo personnalisé
  
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'paid', 'partial'],
    default: 'pending'
  }
}, {
  timestamps: true
});

let RecuPaiement;

const initModel = () => {
  if (!RecuPaiement) {
    try {
      RecuPaiement = mongoose.model('RecuPaiement');
    } catch (error) {
      RecuPaiement = mongoose.model('RecuPaiement', recuPaiementSchema);
    }
  }
  return RecuPaiement;
};

const getRecuPaiementModel = () => {
  return RecuPaiement;
};

module.exports = { initModel, getRecuPaiementModel };
