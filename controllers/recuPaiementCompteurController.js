const { initModel } = require('../models/recuPaiementCompteurModel');

// Get the current counter value
const getCounter = async (req, res) => {
  try {
    const RecuPaiementCompteur = initModel();
    if (!RecuPaiementCompteur) throw new Error("Model not initialized");

    let counter = await RecuPaiementCompteur.findOne();
    if (!counter) {
      counter = await RecuPaiementCompteur.create({ recupaiementcompt: 1, daterecupaiementcompt: new Date() });
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
    const RecuPaiementCompteur = initModel();

    let counter = await RecuPaiementCompteur.findOne();
    
    // If no counter exists, create one
    if (!counter) {
      counter = await RecuPaiementCompteur.create({ recupaiementcompt: 1, daterecupaiementcompt: new Date() });
    } else {
      // Increment the counter
      counter.recupaiementcompt = counter.recupaiementcompt + 1;
      counter.daterecupaiementcompt = new Date();
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
    const RecuPaiementCompteur = initModel();

    const { recupaiementcompt } = req.body;

    if (!recupaiementcompt || recupaiementcompt < 1) {
      return res.status(400).json({ message: 'Invalid counter value. Value must be a positive number.' });
    }
    
    let counter = await RecuPaiementCompteur.findOne();
    
    // If no counter exists, create one
    if (!counter) {
      counter = await RecuPaiementCompteur.create({
        recupaiementcompt: recupaiementcompt,
        daterecupaiementcompt: new Date()
      });
    } else {
      // Update the counter
      counter.recupaiementcompt = recupaiementcompt;
      counter.daterecupaiementcompt = new Date();
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
