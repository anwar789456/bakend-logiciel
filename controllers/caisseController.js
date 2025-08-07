const mongoose = require('mongoose');
const CaisseModel = require('../models/caisseModel');

// Helper function to get the initialized model
const getCaisseModel = () => {
    return CaisseModel.initModel();
};

// Get all caisse transactions
const getAllCaisseTransactions = async (req, res) => {
    try {
        const Caisse = getCaisseModel();
        const transactions = await Caisse.find({}).sort({ datetransaction: -1 });
        res.status(200).json(transactions);
    } catch (error) {
        console.error('Error fetching caisse transactions:', error);
        res.status(500).json({ message: 'Error fetching caisse transactions', error: error.message });
    }
};

// Create a new caisse transaction
const createCaisseTransaction = async (req, res) => {
    try {
        const { name, montant, transactiontype, datetransaction } = req.body;
        
        if (!name || !montant || !transactiontype) {
            return res.status(400).json({ message: 'Name, montant, and transactiontype are required' });
        }
        
        const Caisse = getCaisseModel();
        const newTransaction = new Caisse({
            name,
            montant,
            transactiontype,
            datetransaction: datetransaction || Date.now()
        });
        
        const savedTransaction = await newTransaction.save();
        res.status(201).json(savedTransaction);
    } catch (error) {
        console.error('Error creating caisse transaction:', error);
        res.status(500).json({ message: 'Error creating caisse transaction', error: error.message });
    }
};

// Get a caisse transaction by ID
const getCaisseTransactionById = async (req, res) => {
    try {
        const { id } = req.params;
        const Caisse = getCaisseModel();
        const transaction = await Caisse.findById(id);
        
        if (!transaction) {
            return res.status(404).json({ message: 'Caisse transaction not found' });
        }
        
        res.status(200).json(transaction);
    } catch (error) {
        console.error('Error fetching caisse transaction:', error);
        res.status(500).json({ message: 'Error fetching caisse transaction', error: error.message });
    }
};

// Update a caisse transaction by ID
const updateCaisseTransactionById = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, montant, transactiontype, datetransaction } = req.body;
        
        if (!name || !montant || !transactiontype) {
            return res.status(400).json({ message: 'Name, montant, and transactiontype are required' });
        }
        
        const Caisse = getCaisseModel();
        const updatedTransaction = await Caisse.findByIdAndUpdate(
            id,
            { name, montant, transactiontype, datetransaction },
            { new: true, runValidators: true }
        );
        
        if (!updatedTransaction) {
            return res.status(404).json({ message: 'Caisse transaction not found' });
        }
        
        res.status(200).json(updatedTransaction);
    } catch (error) {
        console.error('Error updating caisse transaction:', error);
        res.status(500).json({ message: 'Error updating caisse transaction', error: error.message });
    }
};

// Delete a caisse transaction by ID
const deleteCaisseTransactionById = async (req, res) => {
    try {
        const { id } = req.params;
        const Caisse = getCaisseModel();
        const deletedTransaction = await Caisse.findByIdAndDelete(id);
        
        if (!deletedTransaction) {
            return res.status(404).json({ message: 'Caisse transaction not found' });
        }
        
        res.status(200).json({ message: 'Caisse transaction deleted successfully' });
    } catch (error) {
        console.error('Error deleting caisse transaction:', error);
        res.status(500).json({ message: 'Error deleting caisse transaction', error: error.message });
    }
};

// Get caisse summary (total income, total expense, balance)
const getCaisseSummary = async (req, res) => {
    try {
        const Caisse = getCaisseModel();
        
        // Get all transactions
        const transactions = await Caisse.find({});
        
        // Calculate totals
        let totalIncome = 0;
        let totalExpense = 0;
        
        transactions.forEach(transaction => {
            if (transaction.transactiontype === 'income') {
                totalIncome += transaction.montant;
            } else if (transaction.transactiontype === 'expense') {
                totalExpense += transaction.montant;
            }
        });
        
        const balance = totalIncome - totalExpense;
        
        res.status(200).json({
            totalIncome,
            totalExpense,
            balance,
            transactionCount: transactions.length
        });
    } catch (error) {
        console.error('Error calculating caisse summary:', error);
        res.status(500).json({ message: 'Error calculating caisse summary', error: error.message });
    }
};

module.exports = {
    getAllCaisseTransactions,
    createCaisseTransaction,
    getCaisseTransactionById,
    updateCaisseTransactionById,
    deleteCaisseTransactionById,
    getCaisseSummary
};