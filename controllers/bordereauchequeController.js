const bordereauchequeModel = require('../models/bordereauchequeModel');

// Helper function to get the initialized model
const getBordereauchequeModel = () => {
    return bordereauchequeModel.initModel();
};

// Get all bordereaucheque items
const getAllBordereaucheques = async (req, res) => {
    try {
        const Bordereaucheque = getBordereauchequeModel();
        const items = await Bordereaucheque.find();
        res.status(200).json(items);
    } catch (error) {
        console.error('Error fetching bordereaucheque items:', error);
        res.status(500).json({ message: 'Error fetching bordereaucheque items', error: error.message });
    }
};

// Get a bordereaucheque by ID
const getBordereauchequeById = async (req, res) => {
    try {
        const { id } = req.params;
        const Bordereaucheque = getBordereauchequeModel();
        const item = await Bordereaucheque.findById(id);
        
        if (!item) {
            return res.status(404).json({ message: `Bordereaucheque with _id ${id} not found` });
        }
        
        res.status(200).json(item);
    } catch (error) {
        console.error('Error fetching bordereaucheque:', error);
        res.status(500).json({ message: 'Error fetching bordereaucheque', error: error.message });
    }
};

// Add a new bordereaucheque
const addBordereaucheque = async (req, res) => {
    try {
        const Bordereaucheque = getBordereauchequeModel();
        const newBordereaucheque = new Bordereaucheque(req.body);
        const savedBordereaucheque = await newBordereaucheque.save();
        res.status(201).json(savedBordereaucheque);
    } catch (error) {
        console.error('Error adding new bordereaucheque:', error);
        res.status(500).json({ message: 'Error adding new bordereaucheque', error: error.message });
    }
};

// Update a bordereaucheque by ID
const updateBordereauchequeById = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const Bordereaucheque = getBordereauchequeModel();
        const updatedBordereaucheque = await Bordereaucheque.findByIdAndUpdate(
            id, 
            updates, 
            { new: true, runValidators: true }
        );
        
        if (!updatedBordereaucheque) {
            return res.status(404).json({ message: `Bordereaucheque with _id ${id} not found` });
        }
        
        res.status(200).json(updatedBordereaucheque);
    } catch (error) {
        console.error('Error updating bordereaucheque:', error);
        res.status(500).json({ message: 'Error updating bordereaucheque', error: error.message });
    }
};

// Delete a bordereaucheque by ID
const deleteBordereauchequeById = async (req, res) => {
    try {
        const { id } = req.params;
        const Bordereaucheque = getBordereauchequeModel();
        const deletedBordereaucheque = await Bordereaucheque.findByIdAndDelete(id);
        
        if (!deletedBordereaucheque) {
            return res.status(404).json({ message: `Bordereaucheque with _id ${id} not found` });
        }
        
        res.status(200).json({ message: `Bordereaucheque with _id ${id} deleted successfully` });
    } catch (error) {
        console.error('Error deleting bordereaucheque:', error);
        res.status(500).json({ message: 'Error deleting bordereaucheque', error: error.message });
    }
};

module.exports = {
    getAllBordereaucheques,
    getBordereauchequeById,
    addBordereaucheque,
    updateBordereauchequeById,
    deleteBordereauchequeById
};
