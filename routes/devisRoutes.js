const express = require("express");
const router = express.Router();

// Import controller functions
const { 
  getAllDevisItems, 
  getDevisById,
  createDevis,
  updateDevisById, 
  deleteDevisById,
  generateDevisPDF
} = require("../controllers/devisController");

// Get all devis items
router.get("/get-devis", getAllDevisItems);

// Get devis by ID
router.get("/get-devis/:id", getDevisById);

// Create new devis
router.post("/create-devis", createDevis);

// Update a devis by _id
router.put("/update-devis/:id", updateDevisById);

// Delete a devis by _id
router.delete("/delete-devis/:id", deleteDevisById);

// Generate PDF for devis
router.get("/devis-pdf/:id", generateDevisPDF);

module.exports = router;