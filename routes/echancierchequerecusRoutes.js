const express = require('express');
const router = express.Router();

// Import controller functions
const {
    getAllEchancierchequerecus,
    getEchancierchequerecusById,
    addEchancierchequerecus,
    updateEchancierchequerecusById,
    deleteEchancierchequerecusById
} = require('../controllers/echancierchequerecusController');

// Get all echancierchequerecus
router.get('/admin/api/logiciel/get-echancierchequerecus', getAllEchancierchequerecus);

// Get echancierchequerecus by ID
router.get('/admin/api/logiciel/get-echancierchequerecus/:id', getEchancierchequerecusById);

// Add new echancierchequerecus
router.post('/admin/api/logiciel/add-echancierchequerecus', addEchancierchequerecus);

// Update an echancierchequerecus by _id
router.put('/admin/api/logiciel/update-echancierchequerecus/:id', updateEchancierchequerecusById);

// Delete an echancierchequerecus by _id
router.delete('/admin/api/logiciel/delete-echancierchequerecus/:id', deleteEchancierchequerecusById);

module.exports = router;
