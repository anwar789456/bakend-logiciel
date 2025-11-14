const express = require('express');
const router = express.Router();

// Import controller functions
const {
    getAllEchancierchequeemis,
    getEchancierchequeemisById,
    addEchancierchequeemis,
    updateEchancierchequeemisById,
    deleteEchancierchequeemisById
} = require('../controllers/echancierchequeemisController');

// Get all echancierchequeemis
router.get('/admin/api/logiciel/get-echancierchequeemis', getAllEchancierchequeemis);

// Get echancierchequeemis by ID
router.get('/admin/api/logiciel/get-echancierchequeemis/:id', getEchancierchequeemisById);

// Add new echancierchequeemis
router.post('/admin/api/logiciel/add-echancierchequeemis', addEchancierchequeemis);

// Update an echancierchequeemis by _id
router.put('/admin/api/logiciel/update-echancierchequeemis/:id', updateEchancierchequeemisById);

// Delete an echancierchequeemis by _id
router.delete('/admin/api/logiciel/delete-echancierchequeemis/:id', deleteEchancierchequeemisById);

module.exports = router;
