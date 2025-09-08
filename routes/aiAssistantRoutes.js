const express = require('express');
const router = express.Router();
const aiAssistantController = require('../controllers/aiAssistantController');

// 🤖 Route principale pour obtenir les insights IA
router.get('/insights', aiAssistantController.getAIInsights);

// 📊 Routes spécifiques pour chaque type d'analyse
router.get('/products', aiAssistantController.analyzeTopProducts);
router.get('/regions', aiAssistantController.analyzeClientsByRegion);
router.get('/predictions', aiAssistantController.generatePredictions);
router.get('/performance', aiAssistantController.analyzeSalesPerformance);

module.exports = router;
