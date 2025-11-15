const express = require('express');
const router = express.Router();

// Import controller functions
const {
    getAllEncoursproduction,
    getEncoursproductionById,
    addEncoursproduction,
    updateEncoursproductionById,
    deleteEncoursproductionById
} = require('../controllers/encoursproductionController');

// Get all encoursproduction
router.get('/admin/api/logiciel/get-encoursproduction', getAllEncoursproduction);

// Get encoursproduction by ID
router.get('/admin/api/logiciel/get-encoursproduction/:id', getEncoursproductionById);

// Add new encoursproduction
router.post('/admin/api/logiciel/add-encoursproduction', addEncoursproduction);

// Update an encoursproduction by _id
router.put('/admin/api/logiciel/update-encoursproduction/:id', updateEncoursproductionById);

// Delete an encoursproduction by _id
router.delete('/admin/api/logiciel/delete-encoursproduction/:id', deleteEncoursproductionById);

module.exports = router;
