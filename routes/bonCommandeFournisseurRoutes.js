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

router.post('/admin/api/logiciel/boncommandefournisseur/createboncommandefournisseur', createBonCommandeFournisseur);
router.get('/admin/api/logiciel/boncommandefournisseur/getboncommandefournisseurs', getAllBonCommandeFournisseurs);
router.get('/admin/api/logiciel/boncommandefournisseur/getboncommandefournisseur/:id', getBonCommandeFournisseurById);
router.put('/admin/api/logiciel/boncommandefournisseur/updateboncommandefournisseur/:id', updateBonCommandeFournisseur);
router.delete('/admin/api/logiciel/boncommandefournisseur/deleteboncommandefournisseur/:id', deleteBonCommandeFournisseur);

module.exports = router;
