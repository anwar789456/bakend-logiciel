const { initModel: initBonReception } = require('../models/bonReceptionModel');

// Créer un nouveau bon de réception
const createBonReception = async (req, res) => {
  const BonReception = initBonReception();
  if (!BonReception) {
    return res.status(500).json({ message: 'BonReception model is not initialized' });
  }

  try {
    const bonReception = new BonReception(req.body);
    await bonReception.save();
    
    res.status(201).json(bonReception);
  } catch (error) {
    console.error('Error creating bon de réception:', error);
    res.status(500).json({ message: 'Erreur lors de la création du bon de réception', error: error.message });
  }
};

// Obtenir tous les bons de réception
const getAllBonReceptions = async (req, res) => {
  const BonReception = initBonReception();
  if (!BonReception) {
    return res.status(500).json({ message: 'BonReception model is not initialized' });
  }

  try {
    const bonReceptions = await BonReception.find().sort({ createdAt: -1 });
    res.json(bonReceptions);
  } catch (error) {
    console.error('Error fetching bon de réceptions:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des bons de réception', error: error.message });
  }
};

// Obtenir un bon de réception par ID
const getBonReceptionById = async (req, res) => {
  const BonReception = initBonReception();
  if (!BonReception) {
    return res.status(500).json({ message: 'BonReception model is not initialized' });
  }

  try {
    const bonReception = await BonReception.findById(req.params.id);
    if (!bonReception) {
      return res.status(404).json({ message: 'Bon de réception non trouvé' });
    }
    res.json(bonReception);
  } catch (error) {
    console.error('Error fetching bon de réception:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du bon de réception', error: error.message });
  }
};

// Mettre à jour un bon de réception
const updateBonReception = async (req, res) => {
  const BonReception = initBonReception();
  if (!BonReception) {
    return res.status(500).json({ message: 'BonReception model is not initialized' });
  }

  try {
    const bonReception = await BonReception.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    
    if (!bonReception) {
      return res.status(404).json({ message: 'Bon de réception non trouvé' });
    }
    
    res.json(bonReception);
  } catch (error) {
    console.error('Error updating bon de réception:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du bon de réception', error: error.message });
  }
};

// Supprimer un bon de réception
const deleteBonReception = async (req, res) => {
  const BonReception = initBonReception();
  if (!BonReception) {
    return res.status(500).json({ message: 'BonReception model is not initialized' });
  }

  try {
    const bonReception = await BonReception.findByIdAndDelete(req.params.id);
    if (!bonReception) {
      return res.status(404).json({ message: 'Bon de réception non trouvé' });
    }
    res.json({ message: 'Bon de réception supprimé avec succès' });
  } catch (error) {
    console.error('Error deleting bon de réception:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du bon de réception', error: error.message });
  }
};

module.exports = {
  createBonReception,
  getAllBonReceptions,
  getBonReceptionById,
  updateBonReception,
  deleteBonReception
};
