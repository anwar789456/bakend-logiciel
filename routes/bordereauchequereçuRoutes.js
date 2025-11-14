const express = require('express');
const router = express.Router();

// Import controller functions
const {
    getAllBordereauchequereçus,
    getBordereauchequereçuById,
    addBordereauchequereçu,
    updateBordereauchequereçuById,
    deleteBordereauchequereçuById
} = require('../controllers/bordereauchequereçuController');

// Get all bordereauchequereçus
router.get('/admin/api/logiciel/get-bordereauchequerecus', getAllBordereauchequereçus);

// Get bordereauchequereçu by ID
router.get('/admin/api/logiciel/get-bordereauchequerecu/:id', getBordereauchequereçuById);

// Add new bordereauchequereçu
router.post('/admin/api/logiciel/add-bordereauchequerecu', addBordereauchequereçu);

// Update a bordereauchequereçu by _id
router.put('/admin/api/logiciel/update-bordereauchequerecu/:id', updateBordereauchequereçuById);

// Delete a bordereauchequereçu by _id
router.delete('/admin/api/logiciel/delete-bordereauchequerecu/:id', deleteBordereauchequereçuById);

module.exports = router;
