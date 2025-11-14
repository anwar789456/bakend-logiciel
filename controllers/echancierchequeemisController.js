const echancierchequeemisModel = require('../models/echancierchequeemisModel');

// Helper function to get the initialized model
const getEchancierchequeemisModel = () => {
    return echancierchequeemisModel.initModel();
};

// Get all echancierchequeemis items
const getAllEchancierchequeemis = async (req, res) => {
    try {
        const Echancierchequeemis = getEchancierchequeemisModel();
        const items = await Echancierchequeemis.find();
        res.status(200).json(items);
    } catch (error) {
        console.error('Error fetching echancierchequeemis items:', error);
        res.status(500).json({ message: 'Error fetching echancierchequeemis items', error: error.message });
    }
};

// Get an echancierchequeemis by ID
const getEchancierchequeemisById = async (req, res) => {
    try {
        const { id } = req.params;
        const Echancierchequeemis = getEchancierchequeemisModel();
        const item = await Echancierchequeemis.findById(id);
        
        if (!item) {
            return res.status(404).json({ message: `Echancierchequeemis with _id ${id} not found` });
        }
        
        res.status(200).json(item);
    } catch (error) {
        console.error('Error fetching echancierchequeemis:', error);
        res.status(500).json({ message: 'Error fetching echancierchequeemis', error: error.message });
    }
};

// Add a new echancierchequeemis
const addEchancierchequeemis = async (req, res) => {
    try {
        const Echancierchequeemis = getEchancierchequeemisModel();
        const newEchancierchequeemis = new Echancierchequeemis(req.body);
        const savedEchancierchequeemis = await newEchancierchequeemis.save();
        res.status(201).json(savedEchancierchequeemis);
    } catch (error) {
        console.error('Error adding new echancierchequeemis:', error);
        res.status(500).json({ message: 'Error adding new echancierchequeemis', error: error.message });
    }
};

// Update an echancierchequeemis by ID
const updateEchancierchequeemisById = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const Echancierchequeemis = getEchancierchequeemisModel();
        const updatedEchancierchequeemis = await Echancierchequeemis.findByIdAndUpdate(
            id, 
            updates, 
            { new: true, runValidators: true }
        );
        
        if (!updatedEchancierchequeemis) {
            return res.status(404).json({ message: `Echancierchequeemis with _id ${id} not found` });
        }
        
        res.status(200).json(updatedEchancierchequeemis);
    } catch (error) {
        console.error('Error updating echancierchequeemis:', error);
        res.status(500).json({ message: 'Error updating echancierchequeemis', error: error.message });
    }
};

// Delete an echancierchequeemis by ID
const deleteEchancierchequeemisById = async (req, res) => {
    try {
        const { id } = req.params;
        const Echancierchequeemis = getEchancierchequeemisModel();
        const deletedEchancierchequeemis = await Echancierchequeemis.findByIdAndDelete(id);
        
        if (!deletedEchancierchequeemis) {
            return res.status(404).json({ message: `Echancierchequeemis with _id ${id} not found` });
        }
        
        res.status(200).json({ message: `Echancierchequeemis with _id ${id} deleted successfully` });
    } catch (error) {
        console.error('Error deleting echancierchequeemis:', error);
        res.status(500).json({ message: 'Error deleting echancierchequeemis', error: error.message });
    }
};

module.exports = {
    getAllEchancierchequeemis,
    getEchancierchequeemisById,
    addEchancierchequeemis,
    updateEchancierchequeemisById,
    deleteEchancierchequeemisById
};
