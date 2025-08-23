const express = require("express");
const router = express.Router();
const factureCompteurModel = require('../models/factureCompteurModel');

// Helper function to get initialized FactureCompteur model
const getFactureCompteurModel = () => {
  return factureCompteurModel.initModel();
};

// Get current facture counter
router.get('/facture-counter', async (req, res) => {
  try {
    const FactureCompteur = getFactureCompteurModel();
    if (!FactureCompteur) {
      return res.status(500).json({ message: "FactureCompteur model not initialized" });
    }
    
    let counter = await FactureCompteur.findOne();
    if (!counter) {
      // Create initial counter if it doesn't exist
      counter = await FactureCompteur.create({
        factureComptValue: '1',
        datefacturecompt: new Date()
      });
    }
    
    res.json(counter);
  } catch (err) {
    console.error('Error fetching facture counter:', err);
    res.status(500).json({ message: "Error fetching facture counter", error: err.message });
  }
});

// Increment the facture counter
router.post('/increment-facture-counter', async (req, res) => {
  try {
    const FactureCompteur = getFactureCompteurModel();
    if (!FactureCompteur) {
      return res.status(500).json({ message: "FactureCompteur model not initialized" });
    }
    
    let counter = await FactureCompteur.findOne();
    if (!counter) {
      counter = await FactureCompteur.create({
        factureComptValue: '2',
        datefacturecompt: new Date()
      });
    } else {
      counter.factureComptValue = (parseInt(counter.factureComptValue) + 1).toString();
      counter.datefacturecompt = new Date();
      await counter.save();
    }
    
    res.json(counter);
  } catch (err) {
    console.error('Error incrementing facture counter:', err);
    res.status(500).json({ message: "Error incrementing facture counter", error: err.message });
  }
});

// Update facture counter to a specific value
router.put('/update-facture-counter', async (req, res) => {
  try {
    const FactureCompteur = getFactureCompteurModel();
    if (!FactureCompteur) {
      return res.status(500).json({ message: "FactureCompteur model not initialized" });
    }
    
    const { factureComptValue } = req.body;
    
    if (!factureComptValue) {
      return res.status(400).json({ message: "factureComptValue is required" });
    }
    
    let counter = await FactureCompteur.findOne();
    if (!counter) {
      counter = await FactureCompteur.create({
        factureComptValue: factureComptValue.toString(),
        datefacturecompt: new Date()
      });
    } else {
      counter.factureComptValue = factureComptValue.toString();
      counter.datefacturecompt = new Date();
      await counter.save();
    }
    
    res.json(counter);
  } catch (err) {
    console.error('Error updating facture counter:', err);
    res.status(500).json({ message: "Error updating facture counter", error: err.message });
  }
});

module.exports = router;
