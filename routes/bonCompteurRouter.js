const express = require("express");
const router = express.Router();

const { getCompteur, updateCompteur } = require('../controllers/bonCompteurController');

// Get the current compteur
router.get('/admin/api/logiciel/boncompteurfournisseur/get-boncompteurfournisseur', getCompteur);

// Update the compteur
router.put('/admin/api/logiciel/boncompteurfournisseur/update-boncompteurfournisseur', updateCompteur);

module.exports = router;
