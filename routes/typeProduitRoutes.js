const express = require('express');
const router = express.Router();

// Import controller functions
const {
    getAllTypeProduits,
    createTypeProduit,
    getTypeProduitById,
    updateTypeProduitById,
    deleteTypeProduitById
} = require('../controllers/typeProduitController');

// Get all type produits
router.get('/admin/api/logiciel/get-type-produits', getAllTypeProduits);

// Get type produit by ID
router.get('/admin/api/logiciel/get-type-produit/:id', getTypeProduitById);

// Create new type produit
router.post('/admin/api/logiciel/create-type-produit', createTypeProduit);

// Update a type produit by _id
router.put('/admin/api/logiciel/update-type-produit/:id', updateTypeProduitById);

// Delete a type produit by _id
router.delete('/admin/api/logiciel/delete-type-produit/:id', deleteTypeProduitById);

module.exports = router;