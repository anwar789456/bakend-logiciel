const express = require('express');
const router = express.Router();
const {
  createBonReception,
  getAllBonReceptions,
  getBonReceptionById,
  updateBonReception,
  deleteBonReception
} = require('../controllers/bonReceptionController');

// Routes CRUD pour les bons de réception
router.post('/admin/api/logiciel/bonreception/create-bonreception', createBonReception);
router.get('/admin/api/logiciel/bonreception/get-bonreceptions', getAllBonReceptions);
router.get('/admin/api/logiciel/bonreception/get-bonreception/:id', getBonReceptionById);
router.put('/admin/api/logiciel/bonreception/update-bonreception/:id', updateBonReception);
router.delete('/admin/api/logiciel/bonreception/delete-bonreception/:id', deleteBonReception);

module.exports = router;
