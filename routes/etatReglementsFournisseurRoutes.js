const express = require('express');
const router = express.Router();
const {
  createEtatReglementsFournisseur,
  getAllEtatReglementsFournisseurs,
  getEtatReglementsFournisseurById,
  updateEtatReglementsFournisseur,
  deleteEtatReglementsFournisseur
} = require('../controllers/etatReglementsFournisseurController');

// Routes CRUD pour les états de règlements fournisseur

router.post('/admin/api/logiciel/etatreglementsfournisseur/createetatreglementsfournisseur', createEtatReglementsFournisseur);
router.get('/admin/api/logiciel/etatreglementsfournisseur/getetatreglementsfournisseurs', getAllEtatReglementsFournisseurs);
router.get('/admin/api/logiciel/etatreglementsfournisseur/getetatreglementsfournisseur/:id', getEtatReglementsFournisseurById);
router.put('/admin/api/logiciel/etatreglementsfournisseur/updateetatreglementsfournisseur/:id', updateEtatReglementsFournisseur);
router.delete('/admin/api/logiciel/etatreglementsfournisseur/deleteetatreglementsfournisseur/:id', deleteEtatReglementsFournisseur);

module.exports = router;
