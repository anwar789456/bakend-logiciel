const express = require("express");
const router = express.Router();

const { getCounter, incrementCounter, updateCounter } = require('../controllers/bonLivraisonCompteurController');

// Get the current counter value
router.get('/admin/api/logiciel/bonlivraison-compteur/get-bonlivraison-counter', getCounter);

// Increment the counter
router.post('/admin/api/logiciel/bonlivraison-compteur/increment', incrementCounter);

// Update the counter to a specific value
router.put('/admin/api/logiciel/bonlivraison-compteur/update', updateCounter);

module.exports = router;
