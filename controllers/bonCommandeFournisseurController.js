const bonCommandeFournisseurModel = require('../models/bonCommandeFournisseurModel');

// Helper function to get the initialized model
const getBonCommandeFournisseurModel = () => {
    return bonCommandeFournisseurModel.initModel();
};

// Créer un nouveau bon de commande fournisseur
const createBonCommandeFournisseur = async (req, res) => {
  try {
    const BonCommandeFournisseur = getBonCommandeFournisseurModel();
    const bonCommande = new BonCommandeFournisseur(req.body);
    await bonCommande.save();
    
    res.status(201).json(bonCommande);
  } catch (error) {
    console.error('Error creating bon de commande fournisseur:', error);
    res.status(500).json({ message: 'Erreur lors de la création du bon de commande fournisseur', error: error.message });
  }
};

// Obtenir tous les bons de commande fournisseur
const getAllBonCommandeFournisseurs = async (req, res) => {
  try {
    const BonCommandeFournisseur = getBonCommandeFournisseurModel();
    const bonCommandes = await BonCommandeFournisseur.find().sort({ createdAt: -1 });
    res.json(bonCommandes);
  } catch (error) {
    console.error('Error fetching bon de commande fournisseurs:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des bons de commande fournisseur', error: error.message });
  }
};

// Obtenir un bon de commande fournisseur par ID
const getBonCommandeFournisseurById = async (req, res) => {
  try {
    const BonCommandeFournisseur = getBonCommandeFournisseurModel();
    const bonCommande = await BonCommandeFournisseur.findById(req.params.id);
    if (!bonCommande) {
      return res.status(404).json({ message: 'Bon de commande fournisseur non trouvé' });
    }
    res.json(bonCommande);
  } catch (error) {
    console.error('Error fetching bon de commande fournisseur:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération du bon de commande fournisseur', error: error.message });
  }
};

// Mettre à jour un bon de commande fournisseur
const updateBonCommandeFournisseur = async (req, res) => {
  try {
    const BonCommandeFournisseur = getBonCommandeFournisseurModel();
    const bonCommande = await BonCommandeFournisseur.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    
    if (!bonCommande) {
      return res.status(404).json({ message: 'Bon de commande fournisseur non trouvé' });
    }
    
    res.json(bonCommande);
  } catch (error) {
    console.error('Error updating bon de commande fournisseur:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du bon de commande fournisseur', error: error.message });
  }
};

// Supprimer un bon de commande fournisseur
const deleteBonCommandeFournisseur = async (req, res) => {
  try {
    const BonCommandeFournisseur = getBonCommandeFournisseurModel();
    const bonCommande = await BonCommandeFournisseur.findByIdAndDelete(req.params.id);
    if (!bonCommande) {
      return res.status(404).json({ message: 'Bon de commande fournisseur non trouvé' });
    }
    res.json({ message: 'Bon de commande fournisseur supprimé avec succès' });
  } catch (error) {
    console.error('Error deleting bon de commande fournisseur:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression du bon de commande fournisseur', error: error.message });
  }
};

module.exports = {
  createBonCommandeFournisseur,
  getAllBonCommandeFournisseurs,
  getBonCommandeFournisseurById,
  updateBonCommandeFournisseur,
  deleteBonCommandeFournisseur
};
