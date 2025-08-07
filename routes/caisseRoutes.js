const express = require('express');
const router = express.Router();

// Import controller functions
const {
    getAllCaisseTransactions,
    createCaisseTransaction,
    getCaisseTransactionById,
    updateCaisseTransactionById,
    deleteCaisseTransactionById,
    getCaisseSummary
} = require('../controllers/caisseController');

// Get all caisse transactions
router.get('/admin/api/logiciel/get-caisse-transactions', getAllCaisseTransactions);

// Get caisse transaction by ID
router.get('/admin/api/logiciel/get-caisse-transaction/:id', getCaisseTransactionById);

// Create new caisse transaction
router.post('/admin/api/logiciel/create-caisse-transaction', createCaisseTransaction);

// Update a caisse transaction by _id
router.put('/admin/api/logiciel/update-caisse-transaction/:id', updateCaisseTransactionById);

// Delete a caisse transaction by _id
router.delete('/admin/api/logiciel/delete-caisse-transaction/:id', deleteCaisseTransactionById);

// Get caisse summary (total income, total expense, balance)
router.get('/admin/api/logiciel/get-caisse-summary', getCaisseSummary);

module.exports = router;