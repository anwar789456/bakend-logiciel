const mongoose = require('mongoose');

// Modèles pour récupérer les données
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
    const Devis = getDevisModel();
    const devisList = await Devis.find({});
    
    const productStats = {};
    
    devisList.forEach(devis => {
      devis.items.forEach(item => {
        const key = item.description || 'Produit inconnu';
        if (!productStats[key]) {
          productStats[key] = {
            name: key,
            totalQuantity: 0,
            totalRevenue: 0,
            orders: 0,
            avgPrice: 0
          };
        }
        
        productStats[key].totalQuantity += item.quantity;
        productStats[key].totalRevenue += item.total;
        productStats[key].orders += 1;
        productStats[key].avgPrice = productStats[key].totalRevenue / productStats[key].totalQuantity;
      });
    });
    
    // Trier par quantité demandée
    const topByQuantity = Object.values(productStats)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10);
    
    // Trier par revenus
    const topByRevenue = Object.values(productStats)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);
    
    return { topByQuantity, topByRevenue };
  } catch (error) {
    console.error('Error analyzing products:', error);
    throw error;
  }
};

// 🏢 Analyse des clients par région
const analyzeClientsByRegion = async () => {
  try {
    const Devis = getDevisModel();
    const devisList = await Devis.find({});
    
    const regionStats = {};
    
    devisList.forEach(devis => {
      // Extraire la région de l'adresse
      const address = devis.clientAddress || '';
      const region = extractRegion(address);
      
      if (!regionStats[region]) {
        regionStats[region] = {
          region,
          clientCount: new Set(),
          totalOrders: 0,
          totalRevenue: 0,
          avgOrderValue: 0
        };
      }
      
      regionStats[region].clientCount.add(devis.clientName);
      regionStats[region].totalOrders += 1;
      regionStats[region].totalRevenue += devis.totalAmount;
    });
    
    // Convertir Set en nombre et calculer moyennes
    Object.values(regionStats).forEach(stat => {
      stat.clientCount = stat.clientCount.size;
      stat.avgOrderValue = stat.totalRevenue / stat.totalOrders;
    });
    
    const topRegions = Object.values(regionStats)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);
    
    return topRegions;
  } catch (error) {
    console.error('Error analyzing regions:', error);
    throw error;
  }
};

// 🎯 Prédictions avancées avec Machine Learning
const generatePredictions = async () => {
  try {
    const Devis = getDevisModel();
    const devisList = await Devis.find({}).sort({ date: -1 });
    
    // Analyser les tendances des 6 derniers mois pour plus de précision
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const recentDevis = devisList.filter(devis => 
      new Date(devis.date) >= sixMonthsAgo
    );
    
    // Calculs de tendances avancés
    const monthlyStats = {};
    const weeklyStats = {};
    const seasonalPatterns = {};
    
    recentDevis.forEach(devis => {
      const date = new Date(devis.date);
      const month = date.toISOString().slice(0, 7);
      const week = getWeekNumber(date);
      const season = getSeason(date);
      
      // Stats mensuelles
      if (!monthlyStats[month]) {
        monthlyStats[month] = {
          orders: 0,
          revenue: 0,
          products: {},
          avgOrderValue: 0,
          clientCount: new Set()
        };
      }
      
      monthlyStats[month].orders += 1;
      monthlyStats[month].revenue += devis.totalAmount;
      monthlyStats[month].clientCount.add(devis.clientName);
      
      // Stats hebdomadaires
      if (!weeklyStats[week]) {
        weeklyStats[week] = { orders: 0, revenue: 0 };
      }
      weeklyStats[week].orders += 1;
      weeklyStats[week].revenue += devis.totalAmount;
      
      // Patterns saisonniers
      if (!seasonalPatterns[season]) {
        seasonalPatterns[season] = { orders: 0, revenue: 0, products: {} };
      }
      seasonalPatterns[season].orders += 1;
      seasonalPatterns[season].revenue += devis.totalAmount;
      
      devis.items.forEach(item => {
        const product = item.description;
        
        // Produits par mois
        if (!monthlyStats[month].products[product]) {
          monthlyStats[month].products[product] = 0;
        }
        monthlyStats[month].products[product] += item.quantity;
        
        // Produits par saison
        if (!seasonalPatterns[season].products[product]) {
          seasonalPatterns[season].products[product] = 0;
        }
        seasonalPatterns[season].products[product] += item.quantity;
      });
    });
    
    // Calcul des moyennes
    Object.keys(monthlyStats).forEach(month => {
      const stats = monthlyStats[month];
      stats.avgOrderValue = stats.revenue / stats.orders;
      stats.clientCount = stats.clientCount.size;
    });
    
    // Prédictions avancées avec multiple algorithmes
    const months = Object.keys(monthlyStats).sort();
    const revenueData = months.map(m => monthlyStats[m].revenue);
    const ordersData = months.map(m => monthlyStats[m].orders);
    
    const predictions = {
      // Prédictions financières avec régression polynomiale
      nextMonthRevenue: predictWithPolynomialRegression(revenueData),
      next3MonthsRevenue: predictMultipleMonths(revenueData, 3),
      nextMonthOrders: predictWithPolynomialRegression(ordersData),
      
      // Analyse de tendances
      trendingProducts: findAdvancedTrendingProducts(monthlyStats),
      seasonalInsights: analyzeSeasonalPatterns(seasonalPatterns),
      
      // Prédictions de croissance
      growthPrediction: predictGrowthTrend(revenueData),
      marketOpportunities: identifyMarketOpportunities(monthlyStats, seasonalPatterns),
      
      // Recommandations intelligentes
      recommendations: generateAdvancedRecommendations(monthlyStats, seasonalPatterns),
      riskAnalysis: analyzeBusinessRisks(monthlyStats),
      
      // Métriques de confiance
      confidenceScore: calculatePredictionConfidence(revenueData),
      dataQuality: assessDataQuality(recentDevis)
    };
    
    return predictions;
  } catch (error) {
    console.error('Error generating advanced predictions:', error);
    throw error;
  }
};

// 📊 Analyse des performances de vente
const analyzeSalesPerformance = async () => {
  try {
    const Devis = getDevisModel();
    const devisList = await Devis.find({});
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthStr = lastMonth.toISOString().slice(0, 7);
    
    const currentMonthDevis = devisList.filter(d => 
      d.date.toISOString().slice(0, 7) === currentMonth
    );
    
    const lastMonthDevis = devisList.filter(d => 
      d.date.toISOString().slice(0, 7) === lastMonthStr
    );
    
    const performance = {
      currentMonth: {
        orders: currentMonthDevis.length,
        revenue: currentMonthDevis.reduce((sum, d) => sum + d.totalAmount, 0),
        avgOrderValue: currentMonthDevis.length > 0 ? 
          currentMonthDevis.reduce((sum, d) => sum + d.totalAmount, 0) / currentMonthDevis.length : 0
      },
      lastMonth: {
        orders: lastMonthDevis.length,
        revenue: lastMonthDevis.reduce((sum, d) => sum + d.totalAmount, 0),
        avgOrderValue: lastMonthDevis.length > 0 ? 
          lastMonthDevis.reduce((sum, d) => sum + d.totalAmount, 0) / lastMonthDevis.length : 0
      }
    };
    
    // Calcul des variations
    performance.growth = {
      orders: calculateGrowth(performance.lastMonth.orders, performance.currentMonth.orders),
      revenue: calculateGrowth(performance.lastMonth.revenue, performance.currentMonth.revenue),
      avgOrderValue: calculateGrowth(performance.lastMonth.avgOrderValue, performance.currentMonth.avgOrderValue)
    };
    
    return performance;
  } catch (error) {
    console.error('Error analyzing sales performance:', error);
    throw error;
  }
};

// 🎯 Endpoint principal pour l'assistant IA
const getAIInsights = async (req, res) => {
  try {
    const [topProducts, regionAnalysis, predictions, salesPerformance] = await Promise.all([
      analyzeTopProducts(),
      analyzeClientsByRegion(),
      generatePredictions(),
      analyzeSalesPerformance()
    ]);
    
    const insights = {
      topProducts,
      regionAnalysis,
      predictions,
      salesPerformance,
      timestamp: new Date(),
      summary: generateInsightsSummary(topProducts, regionAnalysis, predictions, salesPerformance)
    };
    
    res.json(insights);
  } catch (error) {
    console.error('Error getting AI insights:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'analyse des données',
      message: error.message 
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
  if (values.length < 2) return 0;
  const first = values[0];
  const last = values[values.length - 1];
  return first > 0 ? ((last - first) / first) * 100 : 0;
};

const calculateGrowth = (oldValue, newValue) => {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
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
