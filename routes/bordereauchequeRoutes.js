const express = require('express');
const router = express.Router();

// Import controller functions
const {
    getAllBordereaucheques,
    getBordereauchequeById,
    addBordereaucheque,
    updateBordereauchequeById,
    deleteBordereauchequeById
} = require('../controllers/bordereauchequeController');

// Get all bordereaucheques
router.get('/admin/api/logiciel/get-bordereaucheques', getAllBordereaucheques);

// Get bordereaucheque by ID
router.get('/admin/api/logiciel/get-bordereaucheque/:id', getBordereauchequeById);

// Add new bordereaucheque
router.post('/admin/api/logiciel/add-bordereaucheque', addBordereaucheque);

// Update a bordereaucheque by _id
router.put('/admin/api/logiciel/update-bordereaucheque/:id', updateBordereauchequeById);

// Delete a bordereaucheque by _id
router.delete('/admin/api/logiciel/delete-bordereaucheque/:id', deleteBordereauchequeById);

module.exports = router;
