const mongoose = require('mongoose');
const { getConnections } = require('../config/db');

// Schéma dynamique pour accepter toutes les colonnes possibles
const ficheCommandeSchema = new mongoose.Schema({
  // Métadonnées d'import
  _file: {
    type: String,
    required: true,
    description: "Nom du fichier Excel importé"
  },
  _sheet: {
    type: String,
    required: true,
    description: "Nom de la feuille Excel"
  },
  _importDate: {
    type: Date,
    default: Date.now,
    description: "Date d'import du fichier"
  },
  _isManual: {
    type: Boolean,
    default: false,
    description: "Indique si la ligne a été ajoutée manuellement"
  }
}, {
  // Permet d'accepter des champs dynamiques non définis dans le schéma
  strict: false,
  timestamps: true
});

// Index pour améliorer les performances de recherche
ficheCommandeSchema.index({ _file: 1, _sheet: 1 });
ficheCommandeSchema.index({ _importDate: -1 });
ficheCommandeSchema.index({ createdAt: -1 });

// This model will be initialized after the database connection is established
let FicheCommande;

// Function to initialize the model with the appropriate connection
const initModel = () => {
    const { conn2 } = getConnections();
    if (!FicheCommande && conn2) {
        FicheCommande = conn2.model('FicheCommande', ficheCommandeSchema, 'ficheCommandes');
    }
    return FicheCommande;
};

// Export both the model initialization function and the model
module.exports = {
    FicheCommande: null, // Will be set by initModel
    initModel: function() {
        const model = initModel();
        this.FicheCommande = model;
        return model;
    }
};
