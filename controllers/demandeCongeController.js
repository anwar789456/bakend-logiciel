const { DemandeConge, initModel } = require('../models/demandeCongeModel');

// Initialize the model
const demandeCongeModel = initModel();

// Get all demande conge records
const getAllDemandeConges = async (req, res) => {
    try {
        const demandeConges = await demandeCongeModel.find();
        res.status(200).json(demandeConges);
    } catch (error) {
        console.error('Error fetching demande conges:', error);
        res.status(500).json({ message: 'Error fetching demande conges', error: error.message });
    }
};

// Create a new demande conge
const createDemandeConge = async (req, res) => {
    try {
        const { username, job, motif, dateRange, dateEffectuerConge, decisionResponsable } = req.body;

        // Validate required fields
        if (!username || !job || !motif || !dateRange || !dateRange.startDate || !dateRange.endDate) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const newDemandeConge = new demandeCongeModel({
            username,
            job,
            motif,
            dateRange,
            dateEffectuerConge,
            decisionResponsable: decisionResponsable || 'En attente' // Default value if not provided
        });

        const savedDemandeConge = await newDemandeConge.save();
        res.status(201).json(savedDemandeConge);
    } catch (error) {
        console.error('Error creating demande conge:', error);
        res.status(500).json({ message: 'Error creating demande conge', error: error.message });
    }
};

// Get a demande conge by ID
const getDemandeCongeById = async (req, res) => {
    try {
        const demandeConge = await demandeCongeModel.findById(req.params.id);
        if (!demandeConge) {
            return res.status(404).json({ message: 'Demande conge not found' });
        }
        res.status(200).json(demandeConge);
    } catch (error) {
        console.error('Error fetching demande conge:', error);
        res.status(500).json({ message: 'Error fetching demande conge', error: error.message });
    }
};

// Update a demande conge by ID
const updateDemandeCongeById = async (req, res) => {
    try {
        const { username, job, motif, dateRange, dateEffectuerConge, decisionResponsable } = req.body;
        
        // Find the demande conge to update
        const demandeConge = await demandeCongeModel.findById(req.params.id);
        if (!demandeConge) {
            return res.status(404).json({ message: 'Demande conge not found' });
        }

        // Update fields if provided
        if (username) demandeConge.username = username;
        if (job) demandeConge.job = job;
        if (motif) demandeConge.motif = motif;
        if (dateRange) {
            if (dateRange.startDate) demandeConge.dateRange.startDate = dateRange.startDate;
            if (dateRange.endDate) demandeConge.dateRange.endDate = dateRange.endDate;
        }
        if (dateEffectuerConge) demandeConge.dateEffectuerConge = dateEffectuerConge;
        if (decisionResponsable) demandeConge.decisionResponsable = decisionResponsable;

        const updatedDemandeConge = await demandeConge.save();
        res.status(200).json(updatedDemandeConge);
    } catch (error) {
        console.error('Error updating demande conge:', error);
        res.status(500).json({ message: 'Error updating demande conge', error: error.message });
    }
};

// Delete a demande conge by ID
const deleteDemandeCongeById = async (req, res) => {
    try {
        const demandeConge = await demandeCongeModel.findByIdAndDelete(req.params.id);
        if (!demandeConge) {
            return res.status(404).json({ message: 'Demande conge not found' });
        }
        res.status(200).json({ message: 'Demande conge deleted successfully' });
    } catch (error) {
        console.error('Error deleting demande conge:', error);
        res.status(500).json({ message: 'Error deleting demande conge', error: error.message });
    }
};

module.exports = {
    getAllDemandeConges,
    createDemandeConge,
    getDemandeCongeById,
    updateDemandeCongeById,
    deleteDemandeCongeById
};