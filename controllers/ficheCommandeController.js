const ficheCommandeModel = require('../models/ficheCommandes');

// Initialize the FicheCommande model
let FicheCommande = ficheCommandeModel.initModel();

// Get all fiche commandes
exports.getAllFicheCommandes = async (req, res) => {
    try {
        // Ensure model is initialized
        if (!FicheCommande) {
            FicheCommande = ficheCommandeModel.initModel();
        }
        
        const ficheCommandes = await FicheCommande.find().sort({ createdAt: -1 });
        res.status(200).json(ficheCommandes);
    } catch (error) {
        console.error('Error fetching fiche commandes:', error);
        res.status(500).json({ message: 'Error fetching fiche commandes', error: error.message });
    }
};

// Get a single fiche commande by ID
exports.getFicheCommandeById = async (req, res) => {
    try {
        // Ensure model is initialized
        if (!FicheCommande) {
            FicheCommande = ficheCommandeModel.initModel();
        }
        
        const ficheCommande = await FicheCommande.findById(req.params.id);
        if (!ficheCommande) {
            return res.status(404).json({ message: 'Fiche commande not found' });
        }
        res.status(200).json(ficheCommande);
    } catch (error) {
        console.error('Error fetching fiche commande:', error);
        res.status(500).json({ message: 'Error fetching fiche commande', error: error.message });
    }
};

// Create a new fiche commande
exports.createFicheCommande = async (req, res) => {
    try {
        // Ensure model is initialized
        if (!FicheCommande) {
            FicheCommande = ficheCommandeModel.initModel();
        }
        
        const newFicheCommande = new FicheCommande(req.body);
        const savedFicheCommande = await newFicheCommande.save();
        res.status(201).json(savedFicheCommande);
    } catch (error) {
        console.error('Error creating fiche commande:', error);
        res.status(500).json({ message: 'Error creating fiche commande', error: error.message });
    }
};

// Update a fiche commande
exports.updateFicheCommande = async (req, res) => {
    try {
        // Ensure model is initialized
        if (!FicheCommande) {
            FicheCommande = ficheCommandeModel.initModel();
        }
        
        const updatedFicheCommande = await FicheCommande.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!updatedFicheCommande) {
            return res.status(404).json({ message: 'Fiche commande not found' });
        }
        
        res.status(200).json(updatedFicheCommande);
    } catch (error) {
        console.error('Error updating fiche commande:', error);
        res.status(500).json({ message: 'Error updating fiche commande', error: error.message });
    }
};

// Delete a fiche commande
exports.deleteFicheCommande = async (req, res) => {
    try {
        // Ensure model is initialized
        if (!FicheCommande) {
            FicheCommande = ficheCommandeModel.initModel();
        }
        
        const deletedFicheCommande = await FicheCommande.findByIdAndDelete(req.params.id);
        
        if (!deletedFicheCommande) {
            return res.status(404).json({ message: 'Fiche commande not found' });
        }
        
        res.status(200).json({ message: 'Fiche commande deleted successfully' });
    } catch (error) {
        console.error('Error deleting fiche commande:', error);
        res.status(500).json({ message: 'Error deleting fiche commande', error: error.message });
    }
};