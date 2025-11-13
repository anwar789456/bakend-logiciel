const { Conges, initModel } = require('../models/congesModel');

// Helper function to get the initialized model
const getCongesModel = () => {
    return initModel();
};

// Get all conges
const getAllConges = async (req, res) => {
    try {
        const CongesModel = getCongesModel();
        const conges = await CongesModel.find({}).sort({ date_debut: -1 });
        res.status(200).json(conges);
    } catch (error) {
        console.error('Error fetching conges:', error);
        res.status(500).json({ message: 'Error fetching conges', error: error.message });
    }
};

// Get a single conge by ID
const getCongeById = async (req, res) => {
    try {
        const { id } = req.params;
        const CongesModel = getCongesModel();
        const conge = await CongesModel.findById(id);
        
        if (!conge) {
            return res.status(404).json({ message: 'Conge not found' });
        }
        
        res.status(200).json(conge);
    } catch (error) {
        console.error('Error fetching conge:', error);
        res.status(500).json({ message: 'Error fetching conge', error: error.message });
    }
};

// Create a new conge
const createConge = async (req, res) => {
    try {
        const { collaborateur, nbr_jour, date_debut, date_fin, nature } = req.body;
        
        if (!collaborateur || !nbr_jour || !date_debut || !date_fin || !nature) {
            return res.status(400).json({ 
                message: 'All fields are required: collaborateur, nbr_jour, date_debut, date_fin, nature' 
            });
        }
        
        const CongesModel = getCongesModel();
        const newConge = new CongesModel({
            collaborateur,
            nbr_jour,
            date_debut,
            date_fin,
            nature
        });
        
        const savedConge = await newConge.save();
        res.status(201).json(savedConge);
    } catch (error) {
        console.error('Error creating conge:', error);
        res.status(500).json({ message: 'Error creating conge', error: error.message });
    }
};

// Update a conge by ID
const updateCongeById = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const CongesModel = getCongesModel();
        const updatedConge = await CongesModel.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );
        
        if (!updatedConge) {
            return res.status(404).json({ message: 'Conge not found' });
        }
        
        res.status(200).json(updatedConge);
    } catch (error) {
        console.error('Error updating conge:', error);
        res.status(500).json({ message: 'Error updating conge', error: error.message });
    }
};

// Delete a conge by ID
const deleteCongeById = async (req, res) => {
    try {
        const { id } = req.params;
        const CongesModel = getCongesModel();
        const deletedConge = await CongesModel.findByIdAndDelete(id);
        
        if (!deletedConge) {
            return res.status(404).json({ message: 'Conge not found' });
        }
        
        res.status(200).json({ message: 'Conge deleted successfully' });
    } catch (error) {
        console.error('Error deleting conge:', error);
        res.status(500).json({ message: 'Error deleting conge', error: error.message });
    }
};

module.exports = {
    getAllConges,
    getCongeById,
    createConge,
    updateCongeById,
    deleteCongeById
};
