const express = require("express");
const router = express.Router();

const { getCounter, incrementCounter, updateCounter } = require('../controllers/recuPaiementCompteurController');

// Get the current counter value
router.get('/admin/api/logiciel/recupaiement-compteur/get-recupaiement-counter', getCounter);

// Increment the counter
router.post('/admin/api/logiciel/recupaiement-compteur/increment', incrementCounter);

// Update the counter to a specific value
router.put('/admin/api/logiciel/recupaiement-compteur/update', updateCounter);

module.exports = router;
