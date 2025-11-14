const bordereauchequereçuModel = require('../models/bordereauchequereçuModel');

// Helper function to get the initialized model
const getBordereauchequereçuModel = () => {
    return bordereauchequereçuModel.initModel();
};

// Get all bordereauchequereçu items
const getAllBordereauchequereçus = async (req, res) => {
    try {
        const Bordereauchequereçu = getBordereauchequereçuModel();
        const items = await Bordereauchequereçu.find();
        res.status(200).json(items);
    } catch (error) {
        console.error('Error fetching bordereauchequereçu items:', error);
        res.status(500).json({ message: 'Error fetching bordereauchequereçu items', error: error.message });
    }
};

// Get a bordereauchequereçu by ID
const getBordereauchequereçuById = async (req, res) => {
    try {
        const { id } = req.params;
        const Bordereauchequereçu = getBordereauchequereçuModel();
        const item = await Bordereauchequereçu.findById(id);
        
        if (!item) {
            return res.status(404).json({ message: `Bordereauchequereçu with _id ${id} not found` });
        }
        
        res.status(200).json(item);
    } catch (error) {
        console.error('Error fetching bordereauchequereçu:', error);
        res.status(500).json({ message: 'Error fetching bordereauchequereçu', error: error.message });
    }
};

// Add a new bordereauchequereçu
const addBordereauchequereçu = async (req, res) => {
    try {
        const Bordereauchequereçu = getBordereauchequereçuModel();
        const newBordereauchequereçu = new Bordereauchequereçu(req.body);
        const savedBordereauchequereçu = await newBordereauchequereçu.save();
        res.status(201).json(savedBordereauchequereçu);
    } catch (error) {
        console.error('Error adding new bordereauchequereçu:', error);
        res.status(500).json({ message: 'Error adding new bordereauchequereçu', error: error.message });
    }
};

// Update a bordereauchequereçu by ID
const updateBordereauchequereçuById = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const Bordereauchequereçu = getBordereauchequereçuModel();
        const updatedBordereauchequereçu = await Bordereauchequereçu.findByIdAndUpdate(
            id, 
            updates, 
            { new: true, runValidators: true }
        );
        
        if (!updatedBordereauchequereçu) {
            return res.status(404).json({ message: `Bordereauchequereçu with _id ${id} not found` });
        }
        
        res.status(200).json(updatedBordereauchequereçu);
    } catch (error) {
        console.error('Error updating bordereauchequereçu:', error);
        res.status(500).json({ message: 'Error updating bordereauchequereçu', error: error.message });
    }
};

// Delete a bordereauchequereçu by ID
const deleteBordereauchequereçuById = async (req, res) => {
    try {
        const { id } = req.params;
        const Bordereauchequereçu = getBordereauchequereçuModel();
        const deletedBordereauchequereçu = await Bordereauchequereçu.findByIdAndDelete(id);
        
        if (!deletedBordereauchequereçu) {
            return res.status(404).json({ message: `Bordereauchequereçu with _id ${id} not found` });
        }
        
        res.status(200).json({ message: `Bordereauchequereçu with _id ${id} deleted successfully` });
    } catch (error) {
        console.error('Error deleting bordereauchequereçu:', error);
        res.status(500).json({ message: 'Error deleting bordereauchequereçu', error: error.message });
    }
};

module.exports = {
    getAllBordereauchequereçus,
    getBordereauchequereçuById,
    addBordereauchequereçu,
    updateBordereauchequereçuById,
    deleteBordereauchequereçuById
};
