const bordereautraiterecusModel = require('../models/bordereautraiterecusModel');

// Helper function to get the initialized model
const getBordereautraiterecusModel = () => {
    return bordereautraiterecusModel.initModel();
};

// Get all bordereautraiterecus items
const getAllBordereautraiterecus = async (req, res) => {
    try {
        const Bordereautraiterecus = getBordereautraiterecusModel();
        const items = await Bordereautraiterecus.find();
        res.status(200).json(items);
    } catch (error) {
        console.error('Error fetching bordereautraiterecus items:', error);
        res.status(500).json({ message: 'Error fetching bordereautraiterecus items', error: error.message });
    }
};

// Get a bordereautraiterecus by ID
const getBordereautraiterecusById = async (req, res) => {
    try {
        const { id } = req.params;
        const Bordereautraiterecus = getBordereautraiterecusModel();
        const item = await Bordereautraiterecus.findById(id);
        
        if (!item) {
            return res.status(404).json({ message: `Bordereautraiterecus with _id ${id} not found` });
        }
        
        res.status(200).json(item);
    } catch (error) {
        console.error('Error fetching bordereautraiterecus:', error);
        res.status(500).json({ message: 'Error fetching bordereautraiterecus', error: error.message });
    }
};

// Add a new bordereautraiterecus
const addBordereautraiterecus = async (req, res) => {
    try {
        const Bordereautraiterecus = getBordereautraiterecusModel();
        const newBordereautraiterecus = new Bordereautraiterecus(req.body);
        const savedBordereautraiterecus = await newBordereautraiterecus.save();
        res.status(201).json(savedBordereautraiterecus);
    } catch (error) {
        console.error('Error adding new bordereautraiterecus:', error);
        res.status(500).json({ message: 'Error adding new bordereautraiterecus', error: error.message });
    }
};

// Update a bordereautraiterecus by ID
const updateBordereautraiterecusById = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const Bordereautraiterecus = getBordereautraiterecusModel();
        const updatedBordereautraiterecus = await Bordereautraiterecus.findByIdAndUpdate(
            id, 
            updates, 
            { new: true, runValidators: true }
        );
        
        if (!updatedBordereautraiterecus) {
            return res.status(404).json({ message: `Bordereautraiterecus with _id ${id} not found` });
        }
        
        res.status(200).json(updatedBordereautraiterecus);
    } catch (error) {
        console.error('Error updating bordereautraiterecus:', error);
        res.status(500).json({ message: 'Error updating bordereautraiterecus', error: error.message });
    }
};

// Delete a bordereautraiterecus by ID
const deleteBordereautraiterecusById = async (req, res) => {
    try {
        const { id } = req.params;
        const Bordereautraiterecus = getBordereautraiterecusModel();
        const deletedBordereautraiterecus = await Bordereautraiterecus.findByIdAndDelete(id);
        
        if (!deletedBordereautraiterecus) {
            return res.status(404).json({ message: `Bordereautraiterecus with _id ${id} not found` });
        }
        
        res.status(200).json({ message: `Bordereautraiterecus with _id ${id} deleted successfully` });
    } catch (error) {
        console.error('Error deleting bordereautraiterecus:', error);
        res.status(500).json({ message: 'Error deleting bordereautraiterecus', error: error.message });
    }
};

module.exports = {
    getAllBordereautraiterecus,
    getBordereautraiterecusById,
    addBordereautraiterecus,
    updateBordereautraiterecusById,
    deleteBordereautraiterecusById
};
