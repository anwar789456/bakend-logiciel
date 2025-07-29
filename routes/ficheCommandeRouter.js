const express = require('express');
const router = express.Router();
const ficheCommandeController = require('../controllers/ficheCommandeController');

// Get all fiche commandes
router.get('/', ficheCommandeController.getAllFicheCommandes);

// Get a single fiche commande by ID
router.get('/:id', ficheCommandeController.getFicheCommandeById);

// Create a new fiche commande
router.post('/', ficheCommandeController.createFicheCommande);

// Update a fiche commande
router.put('/:id', ficheCommandeController.updateFicheCommande);

// Delete a fiche commande
router.delete('/:id', ficheCommandeController.deleteFicheCommande);

module.exports = router;