const express = require('express');
const router = express.Router();

// Import models
const ProductModel = require('../models/productModel');
const CommandeModel = require('../models/Commande');
const DevisModel = require('../models/devisModel');
const DevisCompteurModel = require('../models/devisCompteurModel');
const MessagerieModel = require('../models/messagerieModel');
const TypeProduitModel = require('../models/typeProduitsModel');
const CaisseModel = require('../models/caisseModel');
const UserModel = require('../models/userModel');
const DemandeCongeModel = require('../models/demandeCongeModel');

// Helper function to get the actual model from the module
function getModel(modelModule) {
  if (modelModule && typeof modelModule.initModel === 'function') {
    return modelModule.initModel();
  }
  if (modelModule && modelModule.Product) {
    return modelModule.Product;
  }
  if (modelModule && modelModule.Commande) {
    return modelModule.Commande;
  }
  if (modelModule && modelModule.Devis) {
    return modelModule.Devis;
  }
  if (modelModule && modelModule.DevisCompteur) {
    return modelModule.DevisCompteur;
  }
  if (modelModule && modelModule.Messagerie) {
    return modelModule.Messagerie;
  }
  if (modelModule && modelModule.TypeProduit) {
    return modelModule.TypeProduit;
  }
  if (modelModule && modelModule.Caisse) {
    return modelModule.Caisse;
  }
  if (modelModule && modelModule.User) {
    return modelModule.User;
  }
  if (modelModule && modelModule.DemandeConge) {
    return modelModule.DemandeConge;
  }
  return modelModule;
}

// Route pour les statistiques générales
router.get('/general', async (req, res) => {
  try {
    const ProductsModel = getModel(ProductModel);
    const CommandesModel = getModel(CommandeModel);
    const DevisModelInstance = getModel(DevisModel);
    const DevisCompteurModelInstance = getModel(DevisCompteurModel);
    const MessagerieModelInstance = getModel(MessagerieModel);
    const DemandeCongeModelInstance = getModel(DemandeCongeModel);

    const stats = {
      products: {
        total: await ProductsModel.countDocuments(),
        available: await ProductsModel.countDocuments({ disponibilite: 'disponible' }),
        categories: await ProductsModel.distinct('categorie').then(cats => cats.length)
      },
      commandes: {
        total: await CommandesModel.countDocuments(),
        pending: await CommandesModel.countDocuments({ status: 'pending' }),
        completed: await CommandesModel.countDocuments({ status: 'completed' })
      },
      devis: {
        total: await DevisModelInstance.countDocuments(),
        recent: await DevisModelInstance.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        })
      },
      messages: {
        total: await MessagerieModelInstance.countDocuments(),
        unread: await MessagerieModelInstance.countDocuments({ read: false })
      },
      demandeConges: {
        total: await DemandeCongeModelInstance.countDocuments(),
        pending: await DemandeCongeModelInstance.countDocuments({ decisionResponsable: 'En attente' }),
        approved: await DemandeCongeModelInstance.countDocuments({ decisionResponsable: 'Approuvé' }),
        rejected: await DemandeCongeModelInstance.countDocuments({ decisionResponsable: 'Rejeté' })
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching general stats:', error);
    res.status(500).json({ error: 'Failed to fetch general statistics' });
  }
});

// Route pour les statistiques spécifiques aux demandes de congé
router.get('/demandeConges', async (req, res) => {
  try {
    const DemandeCongeModelInstance = getModel(DemandeCongeModel);
    
    // Statistiques générales
    const totalDemandes = await DemandeCongeModelInstance.countDocuments();
    const pendingDemandes = await DemandeCongeModelInstance.countDocuments({ decisionResponsable: 'En attente' });
    const approvedDemandes = await DemandeCongeModelInstance.countDocuments({ decisionResponsable: 'Approuvé' });
    const rejectedDemandes = await DemandeCongeModelInstance.countDocuments({ decisionResponsable: 'Rejeté' });
    
    // Statistiques par job
    const demandesByJob = await DemandeCongeModelInstance.aggregate([
      { $group: { _id: '$job', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Statistiques par motif
    const demandesByMotif = await DemandeCongeModelInstance.aggregate([
      { $group: { _id: '$motif', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Statistiques par mois (pour l'année en cours)
    const currentYear = new Date().getFullYear();
    const demandesByMonth = await DemandeCongeModelInstance.aggregate([
      {
        $match: {
          'dateRange.startDate': {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$dateRange.startDate' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      summary: {
        total: totalDemandes,
        pending: pendingDemandes,
        approved: approvedDemandes,
        rejected: rejectedDemandes,
        approvalRate: totalDemandes > 0 ? (approvedDemandes / totalDemandes * 100).toFixed(2) : 0
      },
      byJob: demandesByJob,
      byMotif: demandesByMotif,
      byMonth: demandesByMonth
    });
  } catch (error) {
    console.error('Error fetching demande conge stats:', error);
    res.status(500).json({ error: 'Failed to fetch demande conge statistics' });
  }
});

// Route pour les données de graphiques
router.get('/charts', async (req, res) => {
  try {
    const ProductsModel = getModel(ProductModel);
    const CommandesModel = getModel(CommandeModel);
    const DevisModelInstance = getModel(DevisModel);
    const MessagerieModelInstance = getModel(MessagerieModel);

    // Données pour le pie chart des produits par catégorie
    const productsByCategory = await ProductsModel.aggregate([
      { $group: { _id: '$categorie', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Données pour le pie chart des produits par disponibilité
    const productsByAvailability = await ProductsModel.aggregate([
      { $group: { _id: '$disponibilite', count: { $sum: 1 } } }
    ]);

    // Données pour l'histogramme des commandes par mois
    const commandesByMonth = await CommandesModel.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    // Données pour l'histogramme des devis par mois
    const devisByMonth = await DevisModelInstance.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    // Données pour les messages par jour (7 derniers jours)
    const messagesByDay = await MessagerieModelInstance.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // Formater les données pour les graphiques
    const charts = {
      productsByCategory: productsByCategory.map(item => ({
        name: item._id || 'Non défini',
        value: item.count
      })),
      productsByAvailability: productsByAvailability.map(item => ({
        name: item._id === 'disponible' ? 'Disponible' : 'Indisponible',
        value: item.count
      })),
      commandesByMonth: commandesByMonth.map(item => ({
        name: `${item._id.month}/${item._id.year}`,
        value: item.count
      })),
      devisByMonth: devisByMonth.map(item => ({
        name: `${item._id.month}/${item._id.year}`,
        value: item.count
      })),
      messagesByDay: messagesByDay.map(item => ({
        name: `${item._id.day}/${item._id.month}`,
        value: item.count
      }))
    };

    res.json(charts);
  } catch (error) {
    console.error('Error fetching charts data:', error);
    res.status(500).json({ error: 'Failed to fetch charts data' });
  }
});

// Route pour les clients disponibles (pour les filtres)
router.get('/clients', async (req, res) => {
  try {
    const CommandesModel = getModel(CommandeModel);
    const DevisModelInstance = getModel(DevisModel);

    const commandeClients = await CommandesModel.distinct('nomPrenom');
    const devisClients = await DevisModelInstance.distinct('nomPrenom');
    
    const allClients = [...new Set([...commandeClients, ...devisClients])]
      .filter(client => client && client.trim() !== '')
      .sort();

    res.json(allClients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// Route pour les données des produits avec pagination
router.get('/products', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const ProductsModel = getModel(ProductModel);
    
    const query = search ? {
      $or: [
        { nom: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { categorie: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const total = await ProductsModel.countDocuments(query);
    const products = await ProductsModel.find(query)
      .select('nom description categorie quantite minPrice maxPrice disponibilite createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    res.json({
      data: products,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: products.length,
        totalItems: total
      }
    });
  } catch (error) {
    console.error('Error fetching products data:', error);
    res.status(500).json({ error: 'Failed to fetch products data' });
  }
});

// Route pour les données des commandes avec pagination
router.get('/commandes', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const CommandesModel = getModel(CommandeModel);
    
    const query = search ? {
      $or: [
        { nomPrenom: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { telephone: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const total = await CommandesModel.countDocuments(query);
    const commandes = await CommandesModel.find(query)
      .select('nomPrenom email telephone gouvernorat createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    res.json({
      data: commandes,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: commandes.length,
        totalItems: total
      }
    });
  } catch (error) {
    console.error('Error fetching commandes data:', error);
    res.status(500).json({ error: 'Failed to fetch commandes data' });
  }
});

// Route pour les données des devis avec pagination
router.get('/devis', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const DevisModelInstance = getModel(DevisModel);
    
    const query = search ? {
      $or: [
        { nomPrenom: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { telephone: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const total = await DevisModelInstance.countDocuments(query);
    const devis = await DevisModelInstance.find(query)
      .select('nomPrenom email telephone gouvernorat createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    res.json({
      data: devis,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: devis.length,
        totalItems: total
      }
    });
  } catch (error) {
    console.error('Error fetching devis data:', error);
    res.status(500).json({ error: 'Failed to fetch devis data' });
  }
});

// Route pour les données des messages avec pagination
router.get('/messages', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const MessagerieModelInstance = getModel(MessagerieModel);
    
    const query = search ? {
      $or: [
        { nom: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const total = await MessagerieModelInstance.countDocuments(query);
    const messages = await MessagerieModelInstance.find(query)
      .select('nom email message createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    res.json({
      data: messages,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: messages.length,
        totalItems: total
      }
    });
  } catch (error) {
    console.error('Error fetching messages data:', error);
    res.status(500).json({ error: 'Failed to fetch messages data' });
  }
});

module.exports = router;
