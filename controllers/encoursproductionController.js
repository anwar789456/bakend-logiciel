const encoursproductionModel = require('../models/encoursproductionModel');

// Helper function to get the initialized model
const getEncoursproductionModel = () => {
    return encoursproductionModel.initModel();
};

// Get all encoursproduction items
const getAllEncoursproduction = async (req, res) => {
    try {
        const Encoursproduction = getEncoursproductionModel();
        const items = await Encoursproduction.find();
        res.status(200).json(items);
    } catch (error) {
        console.error('Error fetching encoursproduction items:', error);
        res.status(500).json({ message: 'Error fetching encoursproduction items', error: error.message });
    }
};

// Get an encoursproduction by ID
const getEncoursproductionById = async (req, res) => {
    try {
        const { id } = req.params;
        const Encoursproduction = getEncoursproductionModel();
        const item = await Encoursproduction.findById(id);
        
        if (!item) {
            return res.status(404).json({ message: `Encoursproduction with _id ${id} not found` });
        }
        
        res.status(200).json(item);
    } catch (error) {
        console.error('Error fetching encoursproduction:', error);
        res.status(500).json({ message: 'Error fetching encoursproduction', error: error.message });
    }
};

// Add a new encoursproduction
const addEncoursproduction = async (req, res) => {
    try {
        const Encoursproduction = getEncoursproductionModel();
        const newEncoursproduction = new Encoursproduction(req.body);
        const savedEncoursproduction = await newEncoursproduction.save();
        res.status(201).json(savedEncoursproduction);
    } catch (error) {
        console.error('Error adding new encoursproduction:', error);
        res.status(500).json({ message: 'Error adding new encoursproduction', error: error.message });
    }
};

// Update an encoursproduction by ID
const updateEncoursproductionById = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const Encoursproduction = getEncoursproductionModel();
        const updatedEncoursproduction = await Encoursproduction.findByIdAndUpdate(
            id, 
            updates, 
            { new: true, runValidators: true }
        );
        
        if (!updatedEncoursproduction) {
            return res.status(404).json({ message: `Encoursproduction with _id ${id} not found` });
        }
        
        res.status(200).json(updatedEncoursproduction);
    } catch (error) {
        console.error('Error updating encoursproduction:', error);
        res.status(500).json({ message: 'Error updating encoursproduction', error: error.message });
    }
};

// Delete an encoursproduction by ID
const deleteEncoursproductionById = async (req, res) => {
    try {
        const { id } = req.params;
        const Encoursproduction = getEncoursproductionModel();
        const deletedEncoursproduction = await Encoursproduction.findByIdAndDelete(id);
        
        if (!deletedEncoursproduction) {
            return res.status(404).json({ message: `Encoursproduction with _id ${id} not found` });
        }
        
        res.status(200).json({ message: `Encoursproduction with _id ${id} deleted successfully` });
    } catch (error) {
        console.error('Error deleting encoursproduction:', error);
        res.status(500).json({ message: 'Error deleting encoursproduction', error: error.message });
    }
};

module.exports = {
    getAllEncoursproduction,
    getEncoursproductionById,
    addEncoursproduction,
    updateEncoursproductionById,
    deleteEncoursproductionById
};
