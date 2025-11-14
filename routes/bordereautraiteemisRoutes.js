const express = require('express');
const router = express.Router();

// Import controller functions
const {
    getAllBordereautraiteemis,
    getBordereautraiteemisById,
    addBordereautraiteemis,
    updateBordereautraiteemisById,
    deleteBordereautraiteemisById
} = require('../controllers/bordereautraiteemisController');

// Get all bordereautraiteemis
router.get('/admin/api/logiciel/get-bordereautraiteemis', getAllBordereautraiteemis);

// Get bordereautraiteemis by ID
router.get('/admin/api/logiciel/get-bordereautraiteemis/:id', getBordereautraiteemisById);

// Add new bordereautraiteemis
router.post('/admin/api/logiciel/add-bordereautraiteemis', addBordereautraiteemis);

// Update a bordereautraiteemis by _id
router.put('/admin/api/logiciel/update-bordereautraiteemis/:id', updateBordereautraiteemisById);

// Delete a bordereautraiteemis by _id
router.delete('/admin/api/logiciel/delete-bordereautraiteemis/:id', deleteBordereautraiteemisById);

module.exports = router;
