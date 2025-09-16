const express = require('express');
const router = express.Router();
const ficheCommandeController = require('../controllers/ficheCommandeController');

// Routes pour les fiches de commande

// Import Excel
router.post('/import', 
    ficheCommandeController.uploadMiddleware,
    ficheCommandeController.importExcel
);

// CRUD operations
router.get('/', ficheCommandeController.getAllFicheCommandes);
router.get('/summary', ficheCommandeController.getSummary);
router.get('/filter-options', ficheCommandeController.getFilterOptions);
router.get('/:id', ficheCommandeController.getFicheCommandeById);
router.post('/add', ficheCommandeController.createFicheCommande);
router.put('/:id', ficheCommandeController.updateFicheCommande);
router.delete('/:id', ficheCommandeController.deleteFicheCommande);
router.delete('/file/:fileName', ficheCommandeController.deleteByFile);

module.exports = router;
