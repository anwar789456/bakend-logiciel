const echancierchequerecusModel = require('../models/echancierchequerecusModel');

// Helper function to get the initialized model
const getEchancierchequerecusModel = () => {
    return echancierchequerecusModel.initModel();
};

// Get all echancierchequerecus items
const getAllEchancierchequerecus = async (req, res) => {
    try {
        const Echancierchequerecus = getEchancierchequerecusModel();
        const items = await Echancierchequerecus.find();
        res.status(200).json(items);
    } catch (error) {
        console.error('Error fetching echancierchequerecus items:', error);
        res.status(500).json({ message: 'Error fetching echancierchequerecus items', error: error.message });
    }
};

// Get an echancierchequerecus by ID
const getEchancierchequerecusById = async (req, res) => {
    try {
        const { id } = req.params;
        const Echancierchequerecus = getEchancierchequerecusModel();
        const item = await Echancierchequerecus.findById(id);
        
        if (!item) {
            return res.status(404).json({ message: `Echancierchequerecus with _id ${id} not found` });
        }
        
        res.status(200).json(item);
    } catch (error) {
        console.error('Error fetching echancierchequerecus:', error);
        res.status(500).json({ message: 'Error fetching echancierchequerecus', error: error.message });
    }
};

// Add a new echancierchequerecus
const addEchancierchequerecus = async (req, res) => {
    try {
        const Echancierchequerecus = getEchancierchequerecusModel();
        const newEchancierchequerecus = new Echancierchequerecus(req.body);
        const savedEchancierchequerecus = await newEchancierchequerecus.save();
        res.status(201).json(savedEchancierchequerecus);
    } catch (error) {
        console.error('Error adding new echancierchequerecus:', error);
        res.status(500).json({ message: 'Error adding new echancierchequerecus', error: error.message });
    }
};

// Update an echancierchequerecus by ID
const updateEchancierchequerecusById = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const Echancierchequerecus = getEchancierchequerecusModel();
        const updatedEchancierchequerecus = await Echancierchequerecus.findByIdAndUpdate(
            id, 
            updates, 
            { new: true, runValidators: true }
        );
        
        if (!updatedEchancierchequerecus) {
            return res.status(404).json({ message: `Echancierchequerecus with _id ${id} not found` });
        }
        
        res.status(200).json(updatedEchancierchequerecus);
    } catch (error) {
        console.error('Error updating echancierchequerecus:', error);
        res.status(500).json({ message: 'Error updating echancierchequerecus', error: error.message });
    }
};

// Delete an echancierchequerecus by ID
const deleteEchancierchequerecusById = async (req, res) => {
    try {
        const { id } = req.params;
        const Echancierchequerecus = getEchancierchequerecusModel();
        const deletedEchancierchequerecus = await Echancierchequerecus.findByIdAndDelete(id);
        
        if (!deletedEchancierchequerecus) {
            return res.status(404).json({ message: `Echancierchequerecus with _id ${id} not found` });
        }
        
        res.status(200).json({ message: `Echancierchequerecus with _id ${id} deleted successfully` });
    } catch (error) {
        console.error('Error deleting echancierchequerecus:', error);
        res.status(500).json({ message: 'Error deleting echancierchequerecus', error: error.message });
    }
};

module.exports = {
    getAllEchancierchequerecus,
    getEchancierchequerecusById,
    addEchancierchequerecus,
    updateEchancierchequerecusById,
    deleteEchancierchequerecusById
};
