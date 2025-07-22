const Devis = require("../models/devisModel");

// Get all devis items
const getAllDevisItems = async (req, res) => {
  try {
    const devisItems = await Devis.find();
    res.json(devisItems);
  } catch (err) {
    res.status(500).json({ message: "Error fetching devis items" });
  }
};

// Delete a devis by _id
const deleteDevisById = async (req, res) => {
  try {
    const id = req.params.id;
    await Devis.findByIdAndRemove(id);
    res.json({ message: "Devis item deleted successfully" });
  } catch (err) {
    res.status(404).json({ message: "Devis item not found" });
  }
};

// Update a devis by _id
const updateDevisById = async (req, res) => {
  try {
    const id = req.params.id;
    const devisItem = await Devis.findByIdAndUpdate(id, req.body, { new: true });
    res.json(devisItem);
  } catch (err) {
    res.status(404).json({ message: "Devis item not found" });
  }
};

module.exports = { getAllDevisItems, deleteDevisById, updateDevisById };