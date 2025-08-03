const express = require("express");
const router = express.Router();

// Import controller functions
const { 
  getAllDevisItems, 
  getDevisById,
  createDevis,
  updateDevisById, 
  deleteDevisById,
  generateDevisPDF,
  generateDevisPDFClient,
  generateDevisPDFEntreprise
} = require("../controllers/devisController");

// Get all devis items
router.get("/admin/api/logiciel/get-devis", getAllDevisItems);

// Get devis by ID
router.get("/admin/api/logiciel/get-devis/:id", getDevisById);

// Create new devis
router.post("/admin/api/logiciel/create-devis", createDevis);

// Update a devis by _id
router.put("/admin/api/logiciel/update-devis/:id", updateDevisById);

// Delete a devis by _id
router.delete("/admin/api/logiciel/delete-devis/:id", deleteDevisById);

// Generate PDF for devis (auto)
router.get("/admin/api/logiciel/devis-pdf/:id", generateDevisPDF);
// Generate PDF client normal
router.get("/admin/api/logiciel/devis-pdf-client/:id", generateDevisPDFClient);
// Generate PDF entreprise
router.get("/admin/api/logiciel/devis-pdf-entreprise/:id", generateDevisPDFEntreprise);

module.exports = router;