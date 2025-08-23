const mongoose = require('mongoose');

const recuPaiementCompteurSchema = new mongoose.Schema({
  daterecupaiementcompt: {
    type: Date,
    default: Date.now
  },
  recupaiementcompt: {
    type: Number,
    required: true,
    default: 1
  }
}, {
  timestamps: true
});

let RecuPaiementCompteur;

const initModel = () => {
  if (!RecuPaiementCompteur) {
    try {
      RecuPaiementCompteur = mongoose.model('RecuPaiementCompteur');
    } catch (error) {
      RecuPaiementCompteur = mongoose.model('RecuPaiementCompteur', recuPaiementCompteurSchema);
    }
  }
  return RecuPaiementCompteur;
};

const getRecuPaiementCompteurModel = () => {
  return RecuPaiementCompteur;
};

module.exports = { initModel, getRecuPaiementCompteurModel };
