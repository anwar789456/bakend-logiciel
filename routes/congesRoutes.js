const express = require('express');
const router = express.Router();

// Import controller functions
const {
    getAllConges,
    getCongeById,
    createConge,
    updateCongeById,
    deleteCongeById
} = require('../controllers/congesController');

// Get all conges
router.get('/admin/api/logiciel/get-all-conges', getAllConges);

// Get a single conge by ID
router.get('/admin/api/logiciel/get-conge/:id', getCongeById);

// Create new conge
router.post('/admin/api/logiciel/create-conge', createConge);

// Update a conge by ID
router.put('/admin/api/logiciel/update-conge/:id', updateCongeById);

// Delete a conge by ID
router.delete('/admin/api/logiciel/delete-conge/:id', deleteCongeById);

module.exports = router;
