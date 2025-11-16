const express = require('express');
const router = express.Router();
const {
  createBonCommandeFournisseur,
  getAllBonCommandeFournisseurs,
  getBonCommandeFournisseurById,
  updateBonCommandeFournisseur,
  deleteBonCommandeFournisseur
} = require('../controllers/bonCommandeFournisseurController');

// Routes CRUD pour les bons de commande fournisseur

router.post('/admin/api/logiciel/boncommandefournisseur/create-boncommandefournisseur', createBonCommandeFournisseur);
router.get('/admin/api/logiciel/boncommandefournisseur/get-boncommandefournisseurs', getAllBonCommandeFournisseurs);
router.get('/admin/api/logiciel/boncommandefournisseur/get-boncommandefournisseur/:id', getBonCommandeFournisseurById);
router.put('/admin/api/logiciel/boncommandefournisseur/update-boncommandefournisseur/:id', updateBonCommandeFournisseur);
router.delete('/admin/api/logiciel/boncommandefournisseur/delete-boncommandefournisseur/:id', deleteBonCommandeFournisseur);

module.exports = router;
