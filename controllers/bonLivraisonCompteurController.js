const { initModel } = require('../models/bonLivraisonCompteurModel');

// Get the current counter value
const getCounter = async (req, res) => {
  try {
    const BonLivraisonCompteur = initModel();
    if (!BonLivraisonCompteur) throw new Error("Model not initialized");

    let counter = await BonLivraisonCompteur.findOne();
    if (!counter) {
      counter = await BonLivraisonCompteur.create({ bonLivraisonComptValue: '1', datebonlivraisoncompt: new Date() });
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
    const BonLivraisonCompteur = initModel();

    let counter = await BonLivraisonCompteur.findOne();
    
    // If no counter exists, create one
    if (!counter) {
      counter = await BonLivraisonCompteur.create({ bonLivraisonComptValue: '1', datebonlivraisoncompt: new Date() });
    } else {
      // Increment the counter
      const currentValue = parseInt(counter.bonLivraisonComptValue, 10);
      counter.bonLivraisonComptValue = (currentValue + 1).toString();
      counter.datebonlivraisoncompt = new Date();
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
    const BonLivraisonCompteur = initModel();

    const { bonLivraisonComptValue } = req.body;

    if (!bonLivraisonComptValue || bonLivraisonComptValue.trim() === '') {
      return res.status(400).json({ message: 'Invalid counter value. Value cannot be empty.' });
    }
    
    let counter = await BonLivraisonCompteur.findOne();
    
    // If no counter exists, create one
    if (!counter) {
      counter = await BonLivraisonCompteur.create({
        bonLivraisonComptValue: bonLivraisonComptValue,
        datebonlivraisoncompt: new Date()
      });
    } else {
      // Update the counter
      counter.bonLivraisonComptValue = bonLivraisonComptValue;
      counter.datebonlivraisoncompt = new Date();
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
