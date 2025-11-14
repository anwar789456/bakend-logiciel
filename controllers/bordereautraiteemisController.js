const bordereautraiteemisModel = require('../models/bordereautraiteemisModel');

// Helper function to get the initialized model
const getBordereautraiteemisModel = () => {
    return bordereautraiteemisModel.initModel();
};

// Get all bordereautraiteemis items
const getAllBordereautraiteemis = async (req, res) => {
    try {
        const Bordereautraiteemis = getBordereautraiteemisModel();
        const items = await Bordereautraiteemis.find();
        res.status(200).json(items);
    } catch (error) {
        console.error('Error fetching bordereautraiteemis items:', error);
        res.status(500).json({ message: 'Error fetching bordereautraiteemis items', error: error.message });
    }
};

// Get a bordereautraiteemis by ID
const getBordereautraiteemisById = async (req, res) => {
    try {
        const { id } = req.params;
        const Bordereautraiteemis = getBordereautraiteemisModel();
        const item = await Bordereautraiteemis.findById(id);
        
        if (!item) {
            return res.status(404).json({ message: `Bordereautraiteemis with _id ${id} not found` });
        }
        
        res.status(200).json(item);
    } catch (error) {
        console.error('Error fetching bordereautraiteemis:', error);
        res.status(500).json({ message: 'Error fetching bordereautraiteemis', error: error.message });
    }
};

// Add a new bordereautraiteemis
const addBordereautraiteemis = async (req, res) => {
    try {
        const Bordereautraiteemis = getBordereautraiteemisModel();
        const newBordereautraiteemis = new Bordereautraiteemis(req.body);
        const savedBordereautraiteemis = await newBordereautraiteemis.save();
        res.status(201).json(savedBordereautraiteemis);
    } catch (error) {
        console.error('Error adding new bordereautraiteemis:', error);
        res.status(500).json({ message: 'Error adding new bordereautraiteemis', error: error.message });
    }
};

// Update a bordereautraiteemis by ID
const updateBordereautraiteemisById = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const Bordereautraiteemis = getBordereautraiteemisModel();
        const updatedBordereautraiteemis = await Bordereautraiteemis.findByIdAndUpdate(
            id, 
            updates, 
            { new: true, runValidators: true }
        );
        
        if (!updatedBordereautraiteemis) {
            return res.status(404).json({ message: `Bordereautraiteemis with _id ${id} not found` });
        }
        
        res.status(200).json(updatedBordereautraiteemis);
    } catch (error) {
        console.error('Error updating bordereautraiteemis:', error);
        res.status(500).json({ message: 'Error updating bordereautraiteemis', error: error.message });
    }
};

// Delete a bordereautraiteemis by ID
const deleteBordereautraiteemisById = async (req, res) => {
    try {
        const { id } = req.params;
        const Bordereautraiteemis = getBordereautraiteemisModel();
        const deletedBordereautraiteemis = await Bordereautraiteemis.findByIdAndDelete(id);
        
        if (!deletedBordereautraiteemis) {
            return res.status(404).json({ message: `Bordereautraiteemis with _id ${id} not found` });
        }
        
        res.status(200).json({ message: `Bordereautraiteemis with _id ${id} deleted successfully` });
    } catch (error) {
        console.error('Error deleting bordereautraiteemis:', error);
        res.status(500).json({ message: 'Error deleting bordereautraiteemis', error: error.message });
    }
};

module.exports = {
    getAllBordereautraiteemis,
    getBordereautraiteemisById,
    addBordereautraiteemis,
    updateBordereautraiteemisById,
    deleteBordereautraiteemisById
};
