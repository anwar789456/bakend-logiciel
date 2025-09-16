const mongoose = require('mongoose');

// Helper function to get models dynamically
const getModel = (modelName) => {
  try {
    return mongoose.model(modelName);
  } catch (error) {
    console.error(`Model ${modelName} not found:`, error.message);
    return null;
  }
};

// Get general statistics
const getGeneralStats = async (req, res) => {
  try {
    const Product = getModel('Product');
    const Commande = getModel('Commande');
    const Devis = getModel('Devis');
    const Message = getModel('Message');

    const stats = {
      products: {
        total: Product ? await Product.countDocuments() : 0,
        available: Product ? await Product.countDocuments({ disponibilite: 'disponible' }) : 0,
        categories: Product ? await Product.distinct('categorie').then(cats => cats.length) : 0
      },
      commandes: {
        total: Commande ? await Commande.countDocuments() : 0,
        pending: Commande ? await Commande.countDocuments({ status: 'pending' }) : 0
      },
      devis: {
        total: Devis ? await Devis.countDocuments() : 0,
        recent: Devis ? await Devis.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }) : 0
      },
      messages: {
        total: Message ? await Message.countDocuments() : 0,
        unread: Message ? await Message.countDocuments({ read: false }) : 0
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Error getting general stats:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques générales' });
  }
};

// Get financial statistics
const getFinancialStats = async (req, res) => {
  try {
    const Facture = getModel('Facture');
    const BonLivraison = getModel('BonLivraison');
    const FicheCommande = getModel('FicheCommande');
    const RecuPaiement = getModel('RecuPaiement');

    // Calculate factures stats
    const facturesStats = {
      total: Facture ? await Facture.countDocuments() : 0,
      paid: Facture ? await Facture.countDocuments({ status: 'paid' }) : 0,
      revenue: 0
    };

    if (Facture) {
      const factureRevenue = await Facture.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]);
      facturesStats.revenue = factureRevenue.length > 0 ? factureRevenue[0].total : 0;
    }

    // Calculate bon livraison stats
    const bonLivraisonStats = {
      total: BonLivraison ? await BonLivraison.countDocuments() : 0,
      delivered: BonLivraison ? await BonLivraison.countDocuments({ status: 'delivered' }) : 0
    };

    // Calculate fiche commande stats
    const ficheCommandeStats = {
      total: FicheCommande ? await FicheCommande.countDocuments() : 0,
      recent: FicheCommande ? await FicheCommande.countDocuments({
        _importDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }) : 0,
      revenue: 0
    };

    if (FicheCommande) {
      const ficheRevenue = await FicheCommande.aggregate([
        { $group: { _id: null, total: { $sum: { $toDouble: '$Mt_commande' } } } }
      ]);
      ficheCommandeStats.revenue = ficheRevenue.length > 0 ? ficheRevenue[0].total : 0;
    }

    // Calculate recu paiement stats
    const recuPaiementStats = {
      total: RecuPaiement ? await RecuPaiement.countDocuments() : 0,
      amount: 0
    };

    if (RecuPaiement) {
      const recuAmount = await RecuPaiement.aggregate([
        { $group: { _id: null, total: { $sum: '$montantPaye' } } }
      ]);
      recuPaiementStats.amount = recuAmount.length > 0 ? recuAmount[0].total : 0;
    }

    // Calculate total revenue
    const totalRevenue = facturesStats.revenue + ficheCommandeStats.revenue + recuPaiementStats.amount;

    // Calculate conversion rates
    const conversionRate = {
      devisToFacture: facturesStats.total > 0 && getModel('Devis') ? 
        Math.round((facturesStats.total / await getModel('Devis').countDocuments()) * 100) : 0,
      deliveryRate: bonLivraisonStats.total > 0 ? 
        Math.round((bonLivraisonStats.delivered / bonLivraisonStats.total) * 100) : 0
    };

    const stats = {
      totalRevenue,
      factures: facturesStats,
      bonLivraison: bonLivraisonStats,
      ficheCommande: ficheCommandeStats,
      recuPaiement: recuPaiementStats,
      conversionRate,
      averagePaymentDelay: 15 // Mock data - can be calculated from real payment dates
    };

    res.json(stats);
  } catch (error) {
    console.error('Error getting financial stats:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques financières' });
  }
};

// Get factures data with filters
const getFacturesData = async (req, res) => {
  try {
    const Facture = getModel('Facture');
    if (!Facture) {
      return res.json([]);
    }

    const { search, status, dateFrom, dateTo, limit = 50, offset = 0 } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { numeroFacture: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } },
        { clientEmail: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const factures = await Facture.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    res.json(factures);
  } catch (error) {
    console.error('Error getting factures data:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des données de factures' });
  }
};

// Get bon livraison data with filters
const getBonLivraisonData = async (req, res) => {
  try {
    const BonLivraison = getModel('BonLivraison');
    if (!BonLivraison) {
      return res.json([]);
    }

    const { search, status, dateFrom, dateTo, limit = 50, offset = 0 } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { numeroBonLivraison: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } },
        { clientEmail: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.status = status;
    }
    
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const bonLivraisons = await BonLivraison.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    res.json(bonLivraisons);
  } catch (error) {
    console.error('Error getting bon livraison data:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des données de bons de livraison' });
  }
};

// Get fiche commande data with filters
const getFicheCommandeData = async (req, res) => {
  try {
    const FicheCommande = getModel('FicheCommande');
    if (!FicheCommande) {
      return res.json([]);
    }

    const { search, file, sheet, dateFrom, dateTo, limit = 50, offset = 0 } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { Client: { $regex: search, $options: 'i' } },
        { Commande: { $regex: search, $options: 'i' } },
        { _file: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (file) {
      query._file = file;
    }
    
    if (sheet) {
      query._sheet = sheet;
    }
    
    if (dateFrom || dateTo) {
      query._importDate = {};
      if (dateFrom) query._importDate.$gte = new Date(dateFrom);
      if (dateTo) query._importDate.$lte = new Date(dateTo);
    }

    const ficheCommandes = await FicheCommande.find(query)
      .sort({ _importDate: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    res.json(ficheCommandes);
  } catch (error) {
    console.error('Error getting fiche commande data:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des données de fiches de commande' });
  }
};

// Get recu paiement data with filters
const getRecuPaiementData = async (req, res) => {
  try {
    const RecuPaiement = getModel('RecuPaiement');
    if (!RecuPaiement) {
      return res.json([]);
    }

    const { search, methodePaiement, dateFrom, dateTo, limit = 50, offset = 0 } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { numeroRecu: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (methodePaiement) {
      query.methodePaiement = methodePaiement;
    }
    
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const recuPaiements = await RecuPaiement.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    res.json(recuPaiements);
  } catch (error) {
    console.error('Error getting recu paiement data:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des données de reçus de paiement' });
  }
};

// Get charts data
const getChartsData = async (req, res) => {
  try {
    const Product = getModel('Product');
    const Commande = getModel('Commande');
    const Devis = getModel('Devis');
    const Message = getModel('Message');

    const chartsData = {
      productsByCategory: [],
      productsByAvailability: [],
      commandesByMonth: [],
      devisByMonth: [],
      messagesByDay: []
    };

    // Products by category
    if (Product) {
      const categoryData = await Product.aggregate([
        { $group: { _id: '$categorie', value: { $sum: 1 } } },
        { $project: { name: '$_id', value: 1, _id: 0 } }
      ]);
      chartsData.productsByCategory = categoryData;

      // Products by availability
      const availabilityData = await Product.aggregate([
        { $group: { _id: '$disponibilite', value: { $sum: 1 } } },
        { $project: { name: '$_id', value: 1, _id: 0 } }
      ]);
      chartsData.productsByAvailability = availabilityData;
    }

    // Commands by month (last 6 months)
    if (Commande) {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const commandesByMonth = await Commande.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            value: { $sum: 1 }
          }
        },
        {
          $project: {
            name: {
              $concat: [
                { $toString: '$_id.month' },
                '/',
                { $toString: '$_id.year' }
              ]
            },
            value: 1,
            _id: 0
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);
      chartsData.commandesByMonth = commandesByMonth;
    }

    // Devis by month
    if (Devis) {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const devisByMonth = await Devis.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            value: { $sum: 1 }
          }
        },
        {
          $project: {
            name: {
              $concat: [
                { $toString: '$_id.month' },
                '/',
                { $toString: '$_id.year' }
              ]
            },
            value: 1,
            _id: 0
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);
      chartsData.devisByMonth = devisByMonth;
    }

    // Messages by day (last 7 days)
    if (Message) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const messagesByDay = await Message.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            value: { $sum: 1 }
          }
        },
        {
          $project: {
            name: {
              $concat: [
                { $toString: '$_id.day' },
                '/',
                { $toString: '$_id.month' }
              ]
            },
            value: 1,
            _id: 0
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]);
      chartsData.messagesByDay = messagesByDay;
    }

    res.json(chartsData);
  } catch (error) {
    console.error('Error getting charts data:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des données de graphiques' });
  }
};

// Get available clients
const getAvailableClients = async (req, res) => {
  try {
    const Commande = getModel('Commande');
    const Devis = getModel('Devis');
    const Facture = getModel('Facture');

    let clients = [];

    if (Commande) {
      const commandeClients = await Commande.distinct('nomPrenom');
      clients = [...clients, ...commandeClients];
    }

    if (Devis) {
      const devisClients = await Devis.distinct('nomPrenom');
      clients = [...clients, ...devisClients];
    }

    if (Facture) {
      const factureClients = await Facture.distinct('clientName');
      clients = [...clients, ...factureClients];
    }

    // Remove duplicates and filter out empty values
    const uniqueClients = [...new Set(clients)].filter(client => client && client.trim() !== '');

    res.json(uniqueClients);
  } catch (error) {
    console.error('Error getting available clients:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des clients disponibles' });
  }
};

module.exports = {
  getGeneralStats,
  getFinancialStats,
  getFacturesData,
  getBonLivraisonData,
  getFicheCommandeData,
  getRecuPaiementData,
  getChartsData,
  getAvailableClients
};
