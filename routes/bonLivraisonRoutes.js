const express = require('express');
const router = express.Router();
const {
  createBonLivraison,
  getAllBonLivraisons,
  getBonLivraisonById,
  updateBonLivraison,
  deleteBonLivraison,
  generateBonLivraisonPDF,
  uploadLogo,
  getLogo,
  upload
} = require('../controllers/bonLivraisonController');

// Routes CRUD pour les bons de livraison
router.post('/create-bonlivraison', createBonLivraison);
router.get('/get-bonlivraisons', getAllBonLivraisons);
router.get('/get-bonlivraisons/:id', getBonLivraisonById);
router.put('/update-bonlivraison/:id', updateBonLivraison);
router.delete('/delete-bonlivraison/:id', deleteBonLivraison);

// Route pour générer le PDF
router.get('/bonlivraison-pdf/:id', generateBonLivraisonPDF);

// Upload logo for bon de livraison
router.post('/bonlivraison/upload-logo', upload.single('logo'), uploadLogo);

// Get uploaded logo
router.get('/bonlivraison/logo/:logoName', getLogo);

module.exports = router;
