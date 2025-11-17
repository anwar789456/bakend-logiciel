const express = require("express");
const router = express.Router();

const { getCompteur, updateCompteur } = require('../controllers/bonReceptionCompteurController');

// Get the current compteur
router.get('/admin/api/logiciel/bonreceptioncompteur/get-bonreceptioncompteur', getCompteur);

// Update the compteur
router.put('/admin/api/logiciel/bonreceptioncompteur/update-bonreceptioncompteur', updateCompteur);

module.exports = router;
