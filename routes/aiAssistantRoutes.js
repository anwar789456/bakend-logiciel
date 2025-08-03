const express = require('express');
const router = express.Router();
const aiAssistantController = require('../controllers/aiAssistantController');

// 🤖 Route principale pour obtenir les insights IA
router.get('/admin/api/ai/insights', aiAssistantController.getAIInsights);

// 📊 Routes spécifiques pour chaque type d'analyse
router.get('/admin/api/ai/products', aiAssistantController.analyzeTopProducts);
router.get('/admin/api/ai/regions', aiAssistantController.analyzeClientsByRegion);
router.get('/admin/api/ai/predictions', aiAssistantController.generatePredictions);
router.get('/admin/api/ai/performance', aiAssistantController.analyzeSalesPerformance);

module.exports = router;
