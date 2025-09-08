const express = require('express');
const router = express.Router();
const {
  createRecuPaiement,
  getAllRecuPaiements,
  getRecuPaiementById,
  updateRecuPaiement,
  deleteRecuPaiement,
  generateRecuPaiementPDF,
  uploadLogo,
  getLogo,
  upload
} = require('../controllers/recuPaiementController');

// Routes pour les reçus de paiement
router.post('/create-recupaiement', createRecuPaiement);
router.get('/get-recupaiements', getAllRecuPaiements);
router.get('/get-recupaiement/:id', getRecuPaiementById);
router.put('/update-recupaiement/:id', updateRecuPaiement);
router.delete('/delete-recupaiement/:id', deleteRecuPaiement);
router.get('/recupaiement-pdf/:id', generateRecuPaiementPDF);

// Upload logo for recu paiement
router.post('/recupaiement/upload-logo', upload.single('logo'), uploadLogo);

// Get uploaded logo
router.get('/recupaiement/logo/:logoName', getLogo);

module.exports = router;
