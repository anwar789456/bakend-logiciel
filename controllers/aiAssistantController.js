const mongoose = require('mongoose');

// Modèles pour récupérer les données
const getFicheCommandeModel = () => {
  try {
    return mongoose.model('FicheCommande');
  } catch (error) {
    const ficheCommandeModel = require('../models/ficheCommandeModel');
    const model = ficheCommandeModel.initModel();
    if (!model) {
      throw new Error('Failed to initialize FicheCommande model');
    }
    return model;
  }
};

const getDevisModel = () => {
  try {
    return mongoose.model('Devis');
  } catch (error) {
    const devisModel = require('../models/devisModel');
    if (!devisModel.Devis) {
      devisModel.initModel();
    }
    return devisModel.Devis;
  }
};

const getProduitsModel = () => {
  try {
    return mongoose.model('Produit');
  } catch (error) {
    const produitModel = require('../models/produitModel');
    if (!produitModel.Produit) {
      produitModel.initModel();
    }
    return produitModel.Produit;
  }
};

// 🧠 Analyse des produits les plus demandés
const analyzeTopProducts = async () => {
  try {
    const FicheCommande = getFicheCommandeModel();
    const fichesList = await FicheCommande.find({});
    
    if (!fichesList || fichesList.length === 0) {
      return { 
        topByQuantity: [], 
        topByRevenue: [],
        message: 'Aucune fiche de commande trouvée'
      };
    }
    
    const productStats = {};
    
    fichesList.forEach(fiche => {
      // Extraire le nom du produit/commande
      const productName = fiche.Commande || fiche.commande || fiche.Produit || fiche.produit || fiche.Article || fiche.article || 'Produit inconnu';
      const quantity = parseFloat(fiche.Quantite || fiche.quantite || fiche.Qty || fiche.qty || 1) || 1;
      const montant = parseFloat(fiche.Mt_commande || fiche['Mt commande'] || fiche.montant || fiche.Montant || fiche.Prix || fiche.prix || 0) || 0;
      
      if (!productStats[productName]) {
        productStats[productName] = {
          name: productName,
          totalQuantity: 0,
          totalRevenue: 0,
          orders: 0,
          avgPrice: 0
        };
      }
      
      productStats[productName].totalQuantity += quantity;
      productStats[productName].totalRevenue += montant;
      productStats[productName].orders += 1;
      productStats[productName].avgPrice = productStats[productName].totalQuantity > 0 ? 
        productStats[productName].totalRevenue / productStats[productName].totalQuantity : 0;
    });
    
    // Trier par quantité demandée
    const topByQuantity = Object.values(productStats)
      .filter(p => p.name !== 'Produit inconnu' && p.totalQuantity > 0)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10);
    
    // Trier par revenus
    const topByRevenue = Object.values(productStats)
      .filter(p => p.name !== 'Produit inconnu' && p.totalRevenue > 0)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);
    
    return { topByQuantity, topByRevenue };
  } catch (error) {
    console.error('Error analyzing products:', error);
    return { 
      topByQuantity: [], 
      topByRevenue: [],
      error: error.message
    };
  }
};

// 🏢 Analyse des clients par région
const analyzeClientsByRegion = async () => {
  try {
    const FicheCommande = getFicheCommandeModel();
    const fichesList = await FicheCommande.find({});
    
    if (!fichesList || fichesList.length === 0) {
      return [];
    }
    
    const regionStats = {};
    
    fichesList.forEach(fiche => {
      // Extraire le client et l'adresse
      const clientName = fiche.Client || fiche.client || fiche.Nom_client || fiche.nom_client || 'Client inconnu';
      const address = fiche.Adresse || fiche.adresse || fiche.Address || fiche.address || '';
      const region = extractRegion(address);
      const montant = parseFloat(fiche.Mt_commande || fiche['Mt commande'] || fiche.montant || fiche.Montant || 0) || 0;
      
      if (!regionStats[region]) {
        regionStats[region] = {
          region,
          clientCount: new Set(),
          totalOrders: 0,
          totalRevenue: 0,
          avgOrderValue: 0
        };
      }
      
      regionStats[region].clientCount.add(clientName);
      regionStats[region].totalOrders += 1;
      regionStats[region].totalRevenue += montant;
    });
    
    // Convertir Set en nombre et calculer moyennes
    Object.values(regionStats).forEach(stat => {
      stat.clientCount = stat.clientCount.size;
      stat.avgOrderValue = stat.totalOrders > 0 ? stat.totalRevenue / stat.totalOrders : 0;
    });
    
    const topRegions = Object.values(regionStats)
      .filter(r => r.region !== 'Non spécifié')
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);
    
    return topRegions;
  } catch (error) {
    console.error('Error analyzing regions:', error);
    return [];
  }
};

// 🎯 Prédictions avancées avec Machine Learning
const generatePredictions = async () => {
  try {
    const FicheCommande = getFicheCommandeModel();
    const fichesList = await FicheCommande.find({}).sort({ _importDate: -1 });
    
    if (!fichesList || fichesList.length === 0) {
      return {
        nextMonthRevenue: 0,
        nextMonthOrders: 0,
        monthlyTrends: { revenue: 'stable', orders: 'stable' },
        seasonalInsights: [],
        recommendations: [],
        totalDataPoints: 0,
        analysisConfidence: 'Low'
      };
    }
    
    // Analyser les tendances des 6 derniers mois pour plus de précision
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const recentFiches = fichesList.filter(fiche => {
      const ficheDate = fiche.Date_commande || fiche['Date commande'] || fiche.date || fiche.Date || fiche._importDate;
      if (!ficheDate) return false;
      try {
        return new Date(ficheDate) >= sixMonthsAgo;
      } catch (e) {
        return false;
      }
    });
    
    // Calculs de tendances avancés
    const monthlyStats = {};
    const seasonalPatterns = {};
    
    recentFiches.forEach(fiche => {
      const ficheDate = fiche.Date_commande || fiche['Date commande'] || fiche.date || fiche.Date || fiche._importDate;
      try {
        const date = new Date(ficheDate);
        const month = date.toISOString().slice(0, 7);
        const season = getSeason(date);
        const revenue = parseFloat(fiche.Mt_commande || fiche['Mt commande'] || fiche.montant || fiche.Montant || 0) || 0;
        
        // Stats mensuelles
        if (!monthlyStats[month]) {
          monthlyStats[month] = { orders: 0, revenue: 0 };
        }
        monthlyStats[month].orders += 1;
        monthlyStats[month].revenue += revenue;
        
        // Patterns saisonniers
        if (!seasonalPatterns[season]) {
          seasonalPatterns[season] = { orders: 0, revenue: 0 };
        }
        seasonalPatterns[season].orders += 1;
        seasonalPatterns[season].revenue += revenue;
      } catch (e) {
        console.warn('Invalid date in fiche:', ficheDate);
      }
    });
    
    // Calcul des moyennes
    Object.keys(monthlyStats).forEach(month => {
      const stats = monthlyStats[month];
      stats.avgOrderValue = stats.orders > 0 ? stats.revenue / stats.orders : 0;
    });
    
    // Prédictions avancées avec multiple algorithmes
    const months = Object.keys(monthlyStats).sort();
    const revenueData = months.map(m => monthlyStats[m].revenue);
    const ordersData = months.map(m => monthlyStats[m].orders);
    
    const predictions = {
      // Prédictions financières simples
      nextMonthRevenue: predictNextValue(revenueData),
      nextMonthOrders: predictNextValue(ordersData),
      
      // Analyse de tendances
      monthlyTrends: {
        revenue: calculateTrend(revenueData),
        orders: calculateTrend(ordersData)
      },
      
      // Insights saisonniers
      seasonalInsights: Object.keys(seasonalPatterns).map(season => ({
        season,
        orders: seasonalPatterns[season].orders,
        revenue: seasonalPatterns[season].revenue,
        avgOrderValue: seasonalPatterns[season].orders > 0 ? 
          seasonalPatterns[season].revenue / seasonalPatterns[season].orders : 0
      })),
      
      // Recommandations basiques
      recommendations: generateBasicRecommendations(monthlyStats, seasonalPatterns),
      
      // Métriques de base
      totalDataPoints: recentFiches.length,
      analysisConfidence: recentFiches.length > 10 ? 'High' : recentFiches.length > 5 ? 'Medium' : 'Low'
    };
    
    return predictions;
  } catch (error) {
    console.error('Error generating advanced predictions:', error);
    return {
      nextMonthRevenue: 0,
      nextMonthOrders: 0,
      monthlyTrends: { revenue: 'stable', orders: 'stable' },
      seasonalInsights: [],
      recommendations: [],
      totalDataPoints: 0,
      analysisConfidence: 'Low',
      error: error.message
    };
  }
};

// 📊 Analyse des performances de vente
const analyzeSalesPerformance = async () => {
  try {
    const FicheCommande = getFicheCommandeModel();
    const fichesList = await FicheCommande.find({});
    
    if (!fichesList || fichesList.length === 0) {
      return {
        currentMonth: { orders: 0, revenue: 0, avgOrderValue: 0 },
        lastMonth: { orders: 0, revenue: 0, avgOrderValue: 0 },
        growth: { orders: 0, revenue: 0, avgOrderValue: 0 }
      };
    }
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthStr = lastMonth.toISOString().slice(0, 7);
    
    const currentMonthFiches = fichesList.filter(f => {
      const ficheDate = f.Date_commande || f['Date commande'] || f.date || f.Date;
      if (!ficheDate) return false;
      try {
        const dateStr = new Date(ficheDate).toISOString().slice(0, 7);
        return dateStr === currentMonth;
      } catch (e) {
        return false;
      }
    });
    
    const lastMonthFiches = fichesList.filter(f => {
      const ficheDate = f.Date_commande || f['Date commande'] || f.date || f.Date;
      if (!ficheDate) return false;
      try {
        const dateStr = new Date(ficheDate).toISOString().slice(0, 7);
        return dateStr === lastMonthStr;
      } catch (e) {
        return false;
      }
    });
    
    const performance = {
      currentMonth: {
        orders: currentMonthFiches.length,
        revenue: currentMonthFiches.reduce((sum, f) => {
          const montant = parseFloat(f.Mt_commande || f['Mt commande'] || f.montant || f.Montant || 0) || 0;
          return sum + montant;
        }, 0),
        avgOrderValue: 0
      },
      lastMonth: {
        orders: lastMonthFiches.length,
        revenue: lastMonthFiches.reduce((sum, f) => {
          const montant = parseFloat(f.Mt_commande || f['Mt commande'] || f.montant || f.Montant || 0) || 0;
          return sum + montant;
        }, 0),
        avgOrderValue: 0
      }
    };
    
    // Calculer les valeurs moyennes
    performance.currentMonth.avgOrderValue = performance.currentMonth.orders > 0 ? 
      performance.currentMonth.revenue / performance.currentMonth.orders : 0;
    performance.lastMonth.avgOrderValue = performance.lastMonth.orders > 0 ? 
      performance.lastMonth.revenue / performance.lastMonth.orders : 0;
    
    // Calcul des variations
    performance.growth = {
      orders: calculateGrowth(performance.lastMonth.orders, performance.currentMonth.orders),
      revenue: calculateGrowth(performance.lastMonth.revenue, performance.currentMonth.revenue),
      avgOrderValue: calculateGrowth(performance.lastMonth.avgOrderValue, performance.currentMonth.avgOrderValue)
    };
    
    return performance;
  } catch (error) {
    console.error('Error analyzing sales performance:', error);
    return {
      currentMonth: { orders: 0, revenue: 0, avgOrderValue: 0 },
      lastMonth: { orders: 0, revenue: 0, avgOrderValue: 0 },
      growth: { orders: 0, revenue: 0, avgOrderValue: 0 },
      error: error.message
    };
  }
};

// 🎯 Endpoint principal pour l'assistant IA
const getAIInsights = async (req, res) => {
  try {
    console.log('Starting AI insights analysis...');
    
    const [topProducts, regionAnalysis, predictions, salesPerformance] = await Promise.all([
      analyzeTopProducts().catch(err => {
        console.error('Error in analyzeTopProducts:', err);
        return { topByQuantity: [], topByRevenue: [], error: err.message };
      }),
      analyzeClientsByRegion().catch(err => {
        console.error('Error in analyzeClientsByRegion:', err);
        return [];
      }),
      generatePredictions().catch(err => {
        console.error('Error in generatePredictions:', err);
        return { error: err.message };
      }),
      analyzeSalesPerformance().catch(err => {
        console.error('Error in analyzeSalesPerformance:', err);
        return { error: err.message };
      })
    ]);
    
    const insights = {
      topProducts,
      regionAnalysis,
      predictions,
      salesPerformance,
      timestamp: new Date(),
      summary: generateInsightsSummary(topProducts, regionAnalysis, predictions, salesPerformance)
    };
    
    console.log('AI insights generated successfully');
    res.json(insights);
  } catch (error) {
    console.error('Error getting AI insights:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'analyse des données',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Fonctions utilitaires
const extractRegion = (address) => {
  if (!address) return 'Non spécifié';
  
  const tunisianRegions = [
    'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Zaghouan',
    'Bizerte', 'Béja', 'Jendouba', 'Kef', 'Siliana', 'Sousse',
    'Monastir', 'Mahdia', 'Sfax', 'Kairouan', 'Kasserine', 'Sidi Bouzid',
    'Gabès', 'Médenine', 'Tataouine', 'Gafsa', 'Tozeur', 'Kébili'
  ];
  
  const addressUpper = address.toUpperCase();
  for (const region of tunisianRegions) {
    if (addressUpper.includes(region.toUpperCase())) {
      return region;
    }
  }
  
  return 'Autre';
};

// 🤖 Algorithmes de Machine Learning Avancés

// Régression polynomiale pour prédictions plus précises
const predictWithPolynomialRegression = (values, degree = 2) => {
  if (values.length < 3) return predictNextValue(values);
  
  const n = values.length;
  const x = Array.from({length: n}, (_, i) => i + 1);
  
  // Matrice de Vandermonde pour régression polynomiale
  const matrix = [];
  for (let i = 0; i < n; i++) {
    const row = [];
    for (let j = 0; j <= degree; j++) {
      row.push(Math.pow(x[i], j));
    }
    matrix.push(row);
  }
  
  // Résolution par moindres carrés (simplifiée)
  const coefficients = solveLinearSystem(matrix, values);
  
  // Prédiction pour le point suivant
  let prediction = 0;
  for (let j = 0; j <= degree; j++) {
    prediction += coefficients[j] * Math.pow(n + 1, j);
  }
  
  return Math.max(0, prediction);
};

// Prédictions multiples (3, 6, 12 mois)
const predictMultipleMonths = (values, months) => {
  const predictions = [];
  let currentValues = [...values];
  
  for (let i = 0; i < months; i++) {
    const nextPrediction = predictWithPolynomialRegression(currentValues);
    predictions.push(nextPrediction);
    currentValues.push(nextPrediction);
  }
  
  return predictions;
};

// Régression linéaire simple (fallback)
const predictNextValue = (values) => {
  if (values.length < 2) return values[0] || 0;
  
  const n = values.length;
  const sumX = (n * (n + 1)) / 2;
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = values.reduce((sum, y, i) => sum + (i + 1) * y, 0);
  const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return Math.max(0, slope * (n + 1) + intercept);
};

// Analyse des patterns saisonniers
const analyzeSeasonalPatterns = (seasonalPatterns) => {
  const seasons = Object.keys(seasonalPatterns);
  const insights = [];
  
  seasons.forEach(season => {
    const data = seasonalPatterns[season];
    const topProducts = Object.entries(data.products)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([product, quantity]) => ({ product, quantity }));
    
    insights.push({
      season,
      totalRevenue: data.revenue,
      totalOrders: data.orders,
      avgOrderValue: data.revenue / data.orders,
      topProducts,
      performance: calculateSeasonalPerformance(data, seasonalPatterns)
    });
  });
  
  return insights.sort((a, b) => b.totalRevenue - a.totalRevenue);
};

// Prédiction de tendance de croissance
const predictGrowthTrend = (values) => {
  if (values.length < 3) return { trend: 'stable', confidence: 'low' };
  
  const recentGrowth = [];
  for (let i = 1; i < values.length; i++) {
    const growth = ((values[i] - values[i-1]) / values[i-1]) * 100;
    recentGrowth.push(growth);
  }
  
  const avgGrowth = recentGrowth.reduce((a, b) => a + b, 0) / recentGrowth.length;
  const growthVariance = recentGrowth.reduce((sum, g) => sum + Math.pow(g - avgGrowth, 2), 0) / recentGrowth.length;
  
  let trend, confidence;
  
  if (avgGrowth > 5) {
    trend = 'forte_croissance';
  } else if (avgGrowth > 0) {
    trend = 'croissance';
  } else if (avgGrowth > -5) {
    trend = 'stable';
  } else {
    trend = 'déclin';
  }
  
  confidence = growthVariance < 100 ? 'high' : growthVariance < 300 ? 'medium' : 'low';
  
  return {
    trend,
    confidence,
    avgGrowthRate: avgGrowth,
    volatility: Math.sqrt(growthVariance),
    nextMonthGrowthPrediction: avgGrowth
  };
};

// Identification des opportunités de marché
const identifyMarketOpportunities = (monthlyStats, seasonalPatterns) => {
  const opportunities = [];
  
  // Opportunité 1: Produits en croissance rapide
  const growingProducts = findAdvancedTrendingProducts(monthlyStats)
    .filter(p => p.trend > 20)
    .slice(0, 3);
  
  if (growingProducts.length > 0) {
    opportunities.push({
      type: 'product_growth',
      title: 'Produits en forte croissance',
      description: `${growingProducts.length} produits montrent une croissance exceptionnelle`,
      impact: 'high',
      products: growingProducts
    });
  }
  
  // Opportunité 2: Saisons sous-exploitées
  const seasons = Object.keys(seasonalPatterns);
  const avgRevenue = seasons.reduce((sum, s) => sum + seasonalPatterns[s].revenue, 0) / seasons.length;
  const underperformingSeasons = seasons.filter(s => seasonalPatterns[s].revenue < avgRevenue * 0.8);
  
  if (underperformingSeasons.length > 0) {
    opportunities.push({
      type: 'seasonal_opportunity',
      title: 'Potentiel saisonnier',
      description: `Opportunités d'amélioration en ${underperformingSeasons.join(', ')}`,
      impact: 'medium',
      seasons: underperformingSeasons
    });
  }
  
  return opportunities;
};

// Analyse des risques business
const analyzeBusinessRisks = (monthlyStats) => {
  const risks = [];
  const months = Object.keys(monthlyStats).sort();
  
  if (months.length < 3) return risks;
  
  // Risque 1: Volatilité des revenus
  const revenues = months.map(m => monthlyStats[m].revenue);
  const avgRevenue = revenues.reduce((a, b) => a + b, 0) / revenues.length;
  const volatility = Math.sqrt(revenues.reduce((sum, r) => sum + Math.pow(r - avgRevenue, 2), 0) / revenues.length);
  
  if (volatility > avgRevenue * 0.3) {
    risks.push({
      type: 'revenue_volatility',
      level: 'medium',
      description: 'Volatilité élevée des revenus détectée',
      recommendation: 'Diversifier les sources de revenus'
    });
  }
  
  // Risque 2: Déclin récent
  const lastThreeMonths = revenues.slice(-3);
  const isDecline = lastThreeMonths.every((rev, i) => i === 0 || rev < lastThreeMonths[i-1]);
  
  if (isDecline) {
    risks.push({
      type: 'revenue_decline',
      level: 'high',
      description: 'Tendance baissière sur les 3 derniers mois',
      recommendation: 'Action immédiate requise pour inverser la tendance'
    });
  }
  
  return risks;
};

// Score de confiance des prédictions
const calculatePredictionConfidence = (values) => {
  if (values.length < 3) return 30;
  
  // Facteurs de confiance
  const dataPoints = values.length;
  const trend = calculateTrend(values);
  const consistency = calculateConsistency(values);
  
  let confidence = 50; // Base
  
  // Plus de données = plus de confiance
  confidence += Math.min(dataPoints * 5, 30);
  
  // Tendance claire = plus de confiance
  if (Math.abs(trend) > 10) confidence += 15;
  
  // Consistance = plus de confiance
  confidence += consistency * 20;
  
  return Math.min(Math.max(confidence, 0), 100);
};

// Évaluation de la qualité des données
const assessDataQuality = (devisList) => {
  const totalDevis = devisList.length;
  const completeDevis = devisList.filter(d => 
    d.clientName && d.clientAddress && d.items && d.items.length > 0
  ).length;
  
  const completeness = (completeDevis / totalDevis) * 100;
  
  return {
    totalRecords: totalDevis,
    completeRecords: completeDevis,
    completenessScore: completeness,
    quality: completeness > 90 ? 'excellent' : completeness > 70 ? 'good' : 'needs_improvement'
  };
};

// Fonctions utilitaires avancées
const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
};

const getSeason = (date) => {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return 'Printemps';
  if (month >= 6 && month <= 8) return 'Été';
  if (month >= 9 && month <= 11) return 'Automne';
  return 'Hiver';
};

const solveLinearSystem = (matrix, values) => {
  // Résolution simplifiée pour régression polynomiale de degré 2
  const n = matrix.length;
  if (n < 3) return [0, 0, values[0] || 0];
  
  // Méthode des moindres carrés simplifiée
  const a = matrix.map(row => row[2]).reduce((sum, val, i) => sum + val * values[i], 0) / n;
  const b = matrix.map(row => row[1]).reduce((sum, val, i) => sum + val * values[i], 0) / n;
  const c = values.reduce((a, b) => a + b, 0) / n;
  
  return [c, b, a];
};

const calculateSeasonalPerformance = (seasonData, allSeasons) => {
  const totalRevenue = Object.values(allSeasons).reduce((sum, s) => sum + s.revenue, 0);
  const performance = (seasonData.revenue / totalRevenue) * 100;
  
  if (performance > 30) return 'excellent';
  if (performance > 20) return 'good';
  if (performance > 10) return 'average';
  return 'poor';
};

const calculateConsistency = (values) => {
  if (values.length < 2) return 0;
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  // Coefficient de variation inversé (plus c'est bas, plus c'est consistant)
  const cv = stdDev / mean;
  return Math.max(0, 1 - cv);
};

// Analyse avancée des produits tendance
const findAdvancedTrendingProducts = (monthlyStats) => {
  const productTrends = {};
  const months = Object.keys(monthlyStats).sort();
  
  months.forEach(month => {
    Object.keys(monthlyStats[month].products).forEach(product => {
      if (!productTrends[product]) {
        productTrends[product] = {
          monthlyData: [],
          totalSold: 0,
          avgMonthlyGrowth: 0,
          consistency: 0
        };
      }
      productTrends[product].monthlyData.push(monthlyStats[month].products[product]);
      productTrends[product].totalSold += monthlyStats[month].products[product];
    });
  });
  
  return Object.keys(productTrends)
    .map(product => {
      const data = productTrends[product];
      const trend = calculateTrend(data.monthlyData);
      const consistency = calculateConsistency(data.monthlyData);
      const momentum = calculateMomentum(data.monthlyData);
      
      return {
        product,
        trend,
        totalSold: data.totalSold,
        consistency,
        momentum,
        score: trend * 0.4 + consistency * 0.3 + momentum * 0.3
      };
    })
    .filter(p => p.trend > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
};

const calculateMomentum = (values) => {
  if (values.length < 3) return 0;
  
  const recent = values.slice(-3);
  const earlier = values.slice(0, -3);
  
  if (earlier.length === 0) return 0;
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
  
  return earlierAvg > 0 ? ((recentAvg - earlierAvg) / earlierAvg) * 100 : 0;
};

// Recommandations avancées
const generateAdvancedRecommendations = (monthlyStats, seasonalPatterns) => {
  const recommendations = [];
  const months = Object.keys(monthlyStats).sort();
  
  if (months.length < 2) return recommendations;
  
  // Analyse de la croissance récente
  const recentMonths = months.slice(-3);
  const recentRevenues = recentMonths.map(m => monthlyStats[m].revenue);
  const growthTrend = predictGrowthTrend(recentRevenues);
  
  // Recommandations basées sur la tendance
  if (growthTrend.trend === 'forte_croissance') {
    recommendations.push({
      type: 'growth_opportunity',
      priority: 'high',
      title: 'Capitaliser sur la croissance',
      message: 'Votre business est en forte croissance !',
      actions: [
        'Augmenter les stocks des produits populaires',
        'Investir dans le marketing pour maintenir l\'élan',
        'Préparer l\'expansion de l\'équipe'
      ],
      impact: 'Potentiel d\'augmentation de 25-40% du CA'
    });
  } else if (growthTrend.trend === 'déclin') {
    recommendations.push({
      type: 'urgent_action',
      priority: 'critical',
      title: 'Action corrective requise',
      message: 'Tendance baissière détectée - intervention nécessaire',
      actions: [
        'Analyser les causes du déclin',
        'Lancer une campagne promotionnelle',
        'Revoir la stratégie produit',
        'Améliorer l\'expérience client'
      ],
      impact: 'Critique pour la survie de l\'entreprise'
    });
  }
  
  // Recommandations saisonnières
  const bestSeason = Object.keys(seasonalPatterns)
    .reduce((best, season) => 
      seasonalPatterns[season].revenue > seasonalPatterns[best].revenue ? season : best
    );
  
  recommendations.push({
    type: 'seasonal_strategy',
    priority: 'medium',
    title: `Optimiser la saison ${bestSeason}`,
    message: `${bestSeason} est votre meilleure saison`,
    actions: [
      `Préparer un stock renforcé pour ${bestSeason}`,
      'Développer des produits saisonniers spécifiques',
      'Planifier des campagnes marketing ciblées'
    ],
    impact: 'Potentiel d\'amélioration de 15-25%'
  });
  
  return recommendations;
};

const findTrendingProducts = (monthlyStats) => {
  return findAdvancedTrendingProducts(monthlyStats);
};

const calculateTrend = (values) => {
  if (values.length < 2) return 'stable';
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const change = ((secondAvg - firstAvg) / firstAvg) * 100;
  
  if (change > 10) return 'croissant';
  if (change < -10) return 'décroissant';
  return 'stable';
};

const calculateGrowth = (oldValue, newValue) => {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
};


const generateBasicRecommendations = (monthlyStats, seasonalPatterns) => {
  const recommendations = [];
  
  const months = Object.keys(monthlyStats).sort();
  if (months.length >= 2) {
    const lastMonth = monthlyStats[months[months.length - 1]];
    const previousMonth = monthlyStats[months[months.length - 2]];
    
    if (lastMonth.revenue > previousMonth.revenue) {
      recommendations.push({
        type: 'positive',
        title: 'Croissance positive',
        description: 'Vos revenus sont en hausse ce mois-ci. Continuez sur cette lancée!'
      });
    } else {
      recommendations.push({
        type: 'attention',
        title: 'Baisse des revenus',
        description: 'Analysez les causes de la baisse et ajustez votre stratégie.'
      });
    }
  }
  
  // Analyse saisonnière - vérifier que seasonalPatterns n'est pas vide
  const seasonKeys = Object.keys(seasonalPatterns);
  if (seasonKeys.length > 0) {
    const bestSeason = seasonKeys.reduce((a, b) => 
      seasonalPatterns[a].revenue > seasonalPatterns[b].revenue ? a : b
    );
    
    recommendations.push({
      type: 'insight',
      title: 'Meilleure saison',
      description: `La saison "${bestSeason}" génère le plus de revenus. Préparez-vous en conséquence.`
    });
  } else {
    recommendations.push({
      type: 'info',
      title: 'Données insuffisantes',
      description: 'Pas assez de données pour analyser les tendances saisonnières.'
    });
  }
  
  return recommendations;
};

const generateRecommendations = (monthlyStats) => {
  const recommendations = [];
  
  // Analyser les tendances pour générer des recommandations
  const months = Object.keys(monthlyStats).sort();
  if (months.length >= 2) {
    const lastMonth = monthlyStats[months[months.length - 1]];
    const previousMonth = monthlyStats[months[months.length - 2]];
    
    if (lastMonth.revenue > previousMonth.revenue) {
      recommendations.push({
        type: 'positive',
        message: 'Excellente croissance du chiffre d\'affaires ce mois-ci !',
        action: 'Continuez sur cette lancée en maintenant la qualité du service.'
      });
    } else {
      recommendations.push({
        type: 'warning',
        message: 'Baisse du chiffre d\'affaires détectée.',
        action: 'Analysez les causes et considérez des actions promotionnelles.'
      });
    }
  }
  
  return recommendations;
};

const generateInsightsSummary = (topProducts, regionAnalysis, predictions, salesPerformance) => {
  const summary = {
    keyFindings: [],
    recommendations: [],
    alerts: []
  };
  
  // Produit le plus populaire
  if (topProducts.topByQuantity.length > 0) {
    summary.keyFindings.push(
      `Le produit le plus demandé est "${topProducts.topByQuantity[0].name}" avec ${topProducts.topByQuantity[0].totalQuantity} unités vendues.`
    );
  }
  
  // Région la plus profitable
  if (regionAnalysis.length > 0) {
    summary.keyFindings.push(
      `La région la plus profitable est ${regionAnalysis[0].region} avec ${regionAnalysis[0].totalRevenue.toFixed(0)} DT de revenus.`
    );
  }
  
  // Croissance
  if (salesPerformance.growth.revenue > 0) {
    summary.keyFindings.push(
      `Croissance positive de ${salesPerformance.growth.revenue.toFixed(1)}% du chiffre d'affaires ce mois-ci.`
    );
  }
  
  return summary;
};

module.exports = {
  getAIInsights,
  analyzeTopProducts,
  analyzeClientsByRegion,
  generatePredictions,
  analyzeSalesPerformance
};
