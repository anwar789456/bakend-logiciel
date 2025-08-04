const express = require("express");
const router = express.Router();

const { getCounter, incrementCounter, updateCounter } = require('../controllers/devisCompteurController');

// Get the current counter value
router.get('/admin/api/logiciel/devis-compteur/get-devis-counter', getCounter);

// Increment the counter
router.post('/admin/api/logiciel/devis-compteur/increment', incrementCounter);

// Update the counter to a specific value
router.put('/admin/api/logiciel/devis-compteur/update', updateCounter);

module.exports = router;