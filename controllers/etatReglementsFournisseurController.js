const etatReglementsFournisseurModel = require('../models/etatReglementsFournisseurModel');

// Helper function to get the initialized model
const getEtatReglementsFournisseurModel = () => {
    return etatReglementsFournisseurModel.initModel();
};

// Créer un nouveau état de règlements fournisseur
const createEtatReglementsFournisseur = async (req, res) => {
  try {
    const EtatReglementsFournisseur = getEtatReglementsFournisseurModel();
    const etatReglements = new EtatReglementsFournisseur(req.body);
    await etatReglements.save();
    
    res.status(201).json(etatReglements);
  } catch (error) {
    console.error('Error creating état de règlements fournisseur:', error);
    res.status(500).json({ message: 'Erreur lors de la création de l\'état de règlements fournisseur', error: error.message });
  }
};

// Obtenir tous les états de règlements fournisseur
const getAllEtatReglementsFournisseurs = async (req, res) => {
  try {
    const EtatReglementsFournisseur = getEtatReglementsFournisseurModel();
    const etatReglements = await EtatReglementsFournisseur.find().sort({ createdAt: -1 });
    res.json(etatReglements);
  } catch (error) {
    console.error('Error fetching états de règlements fournisseur:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des états de règlements fournisseur', error: error.message });
  }
};

// Obtenir un état de règlements fournisseur par ID
const getEtatReglementsFournisseurById = async (req, res) => {
  try {
    const EtatReglementsFournisseur = getEtatReglementsFournisseurModel();
    const etatReglements = await EtatReglementsFournisseur.findById(req.params.id);
    if (!etatReglements) {
      return res.status(404).json({ message: 'État de règlements fournisseur non trouvé' });
    }
    res.json(etatReglements);
  } catch (error) {
    console.error('Error fetching état de règlements fournisseur:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'état de règlements fournisseur', error: error.message });
  }
};

// Mettre à jour un état de règlements fournisseur
const updateEtatReglementsFournisseur = async (req, res) => {
  try {
    const EtatReglementsFournisseur = getEtatReglementsFournisseurModel();
    const etatReglements = await EtatReglementsFournisseur.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    
    if (!etatReglements) {
      return res.status(404).json({ message: 'État de règlements fournisseur non trouvé' });
    }
    
    res.json(etatReglements);
  } catch (error) {
    console.error('Error updating état de règlements fournisseur:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'état de règlements fournisseur', error: error.message });
  }
};

// Supprimer un état de règlements fournisseur
const deleteEtatReglementsFournisseur = async (req, res) => {
  try {
    const EtatReglementsFournisseur = getEtatReglementsFournisseurModel();
    const etatReglements = await EtatReglementsFournisseur.findByIdAndDelete(req.params.id);
    if (!etatReglements) {
      return res.status(404).json({ message: 'État de règlements fournisseur non trouvé' });
    }
    res.json({ message: 'État de règlements fournisseur supprimé avec succès' });
  } catch (error) {
    console.error('Error deleting état de règlements fournisseur:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'état de règlements fournisseur', error: error.message });
  }
};

module.exports = {
  createEtatReglementsFournisseur,
  getAllEtatReglementsFournisseurs,
  getEtatReglementsFournisseurById,
  updateEtatReglementsFournisseur,
  deleteEtatReglementsFournisseur
};
