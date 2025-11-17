const { initModel } = require('../models/bonReceptionCompteurModel');

// Get the current compteur
const getCompteur = async (req, res) => {
  try {
    const BonReceptionCompteur = initModel();
    if (!BonReceptionCompteur) throw new Error("Model not initialized");

    let compteur = await BonReceptionCompteur.findOne();
    
    // If no compteur exists, create one with current year
    if (!compteur) {
      const currentYear = new Date().getFullYear().toString().slice(-2);
      compteur = await BonReceptionCompteur.create({ 
        year: currentYear, 
        comptValue: '1',
        updatedAt: new Date() 
      });
    }

    res.status(200).json(compteur);
  } catch (error) {
    console.error('Error getting compteur:', error);
    res.status(500).json({ message: 'Error getting compteur', error: error.message });
  }
};

// Update the compteur
const updateCompteur = async (req, res) => {
  try {
    const BonReceptionCompteur = initModel();
    if (!BonReceptionCompteur) throw new Error("Model not initialized");

    const { year, comptValue } = req.body;

    if (!year || !comptValue) {
      return res.status(400).json({ message: 'Year and comptValue are required' });
    }
    
    let compteur = await BonReceptionCompteur.findOne();
    
    // If no compteur exists, create one
    if (!compteur) {
      compteur = await BonReceptionCompteur.create({
        year: year,
        comptValue: comptValue,
        updatedAt: new Date()
      });
    } else {
      // Update the compteur
      compteur.year = year;
      compteur.comptValue = comptValue;
      compteur.updatedAt = new Date();
      await compteur.save();
    }
    
    res.status(200).json(compteur);
  } catch (error) {
    console.error('Error updating compteur:', error);
    res.status(500).json({ message: 'Error updating compteur', error: error.message });
  }
};

module.exports = {
  getCompteur,
  updateCompteur
};
