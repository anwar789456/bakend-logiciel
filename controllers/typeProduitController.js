const mongoose = require('mongoose');
const TypeProduitModel = require('../models/typeProduitsModel');

// Helper function to get the initialized model
const getTypeProduitModel = () => {
    return TypeProduitModel.initModel();
};

// Get all type produits
const getAllTypeProduits = async (req, res) => {
    try {
        const TypeProduit = getTypeProduitModel();
        const typeProduits = await TypeProduit.find({});
        res.status(200).json(typeProduits);
    } catch (error) {
        console.error('Error fetching type produits:', error);
        res.status(500).json({ message: 'Error fetching type produits', error: error.message });
    }
};

// Create a new type produit
const createTypeProduit = async (req, res) => {
    try {
        const { title, sousTitles } = req.body;
        
        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }
        
        const TypeProduit = getTypeProduitModel();
        const newTypeProduit = new TypeProduit({
            title,
            sousTitles: sousTitles || []
        });
        
        const savedTypeProduit = await newTypeProduit.save();
        res.status(201).json(savedTypeProduit);
    } catch (error) {
        console.error('Error creating type produit:', error);
        res.status(500).json({ message: 'Error creating type produit', error: error.message });
    }
};

// Get a type produit by ID
const getTypeProduitById = async (req, res) => {
    try {
        const { id } = req.params;
        const TypeProduit = getTypeProduitModel();
        const typeProduit = await TypeProduit.findById(id);
        
        if (!typeProduit) {
            return res.status(404).json({ message: 'Type produit not found' });
        }
        
        res.status(200).json(typeProduit);
    } catch (error) {
        console.error('Error fetching type produit:', error);
        res.status(500).json({ message: 'Error fetching type produit', error: error.message });
    }
};

// Update a type produit by ID
const updateTypeProduitById = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, sousTitles } = req.body;
        
        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }
        
        const TypeProduit = getTypeProduitModel();
        const updatedTypeProduit = await TypeProduit.findByIdAndUpdate(
            id,
            { title, sousTitles },
            { new: true, runValidators: true }
        );
        
        if (!updatedTypeProduit) {
            return res.status(404).json({ message: 'Type produit not found' });
        }
        
        res.status(200).json(updatedTypeProduit);
    } catch (error) {
        console.error('Error updating type produit:', error);
        res.status(500).json({ message: 'Error updating type produit', error: error.message });
    }
};

// Delete a type produit by ID
const deleteTypeProduitById = async (req, res) => {
    try {
        const { id } = req.params;
        const TypeProduit = getTypeProduitModel();
        const deletedTypeProduit = await TypeProduit.findByIdAndDelete(id);
        
        if (!deletedTypeProduit) {
            return res.status(404).json({ message: 'Type produit not found' });
        }
        
        res.status(200).json({ message: 'Type produit deleted successfully' });
    } catch (error) {
        console.error('Error deleting type produit:', error);
        res.status(500).json({ message: 'Error deleting type produit', error: error.message });
    }
};

module.exports = {
    getAllTypeProduits,
    createTypeProduit,
    getTypeProduitById,
    updateTypeProduitById,
    deleteTypeProduitById
};