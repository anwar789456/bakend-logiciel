const { initModel } = require('../models/factureCompteurModel');

// Get the current counter value
const getCounter = async (req, res) => {
  try {
    const FactureCompteur = initModel();
    if (!FactureCompteur) throw new Error("Model not initialized");

    let counter = await FactureCompteur.findOne();
    if (!counter) {
      counter = await FactureCompteur.create({ factureComptValue: '1', date: new Date() });
    }

    res.status(200).json(counter);
  } catch (error) {
    console.error('Error getting counter:', error);
    res.status(500).json({ message: 'Error getting counter', error: error.message });
  }
};

// Increment the counter and return the new value
const incrementCounter = async (req, res) => {
  try {
    const FactureCompteur = initModel();

    let counter = await FactureCompteur.findOne();
    
    // If no counter exists, create one
    if (!counter) {
      counter = await FactureCompteur.create({ factureComptValue: '1', date: new Date() });
    } else {
      // Increment the counter
      const currentValue = parseInt(counter.factureComptValue, 10);
      counter.factureComptValue = (currentValue + 1).toString();
      counter.date = new Date();
      await counter.save();
    }
    
    res.status(200).json(counter);
  } catch (error) {
    console.error('Error incrementing counter:', error);
    res.status(500).json({ message: 'Error incrementing counter', error: error.message });
  }
};

// Update the counter to a specific value
const updateCounter = async (req, res) => {
  try {
    const FactureCompteur = initModel();

    const { value } = req.body;
    
    if (!value || value.trim() === '') {
      return res.status(400).json({ message: 'Invalid counter value. Value cannot be empty.' });
    }
    
    let counter = await FactureCompteur.findOne();
    
    // If no counter exists, create one
    if (!counter) {
      counter = await FactureCompteur.create({ 
        factureComptValue: value, 
        datefacturecompt: new Date()
      });
    } else {
      // Update the counter
      counter.factureComptValue = value;
      counter.datefacturecompt = new Date();
      await counter.save();
    }
    
    res.status(200).json(counter);
  } catch (error) {
    console.error('Error updating counter:', error);
    res.status(500).json({ message: 'Error updating counter', error: error.message });
  }
};

module.exports = {
  getCounter,
  incrementCounter,
  updateCounter
};
