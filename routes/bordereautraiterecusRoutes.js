const express = require('express');
const router = express.Router();

// Import controller functions
const {
    getAllBordereautraiterecus,
    getBordereautraiterecusById,
    addBordereautraiterecus,
    updateBordereautraiterecusById,
    deleteBordereautraiterecusById
} = require('../controllers/bordereautraiterecusController');

// Get all bordereautraiterecus
router.get('/admin/api/logiciel/get-bordereautraiterecus', getAllBordereautraiterecus);

// Get bordereautraiterecus by ID
router.get('/admin/api/logiciel/get-bordereautraiterecus/:id', getBordereautraiterecusById);

// Add new bordereautraiterecus
router.post('/admin/api/logiciel/add-bordereautraiterecus', addBordereautraiterecus);

// Update a bordereautraiterecus by _id
router.put('/admin/api/logiciel/update-bordereautraiterecus/:id', updateBordereautraiterecusById);

// Delete a bordereautraiterecus by _id
router.delete('/admin/api/logiciel/delete-bordereautraiterecus/:id', deleteBordereautraiterecusById);

module.exports = router;
