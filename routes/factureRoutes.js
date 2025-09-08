const express = require("express");
const router = express.Router();

// Import controller functions
const { 
  getAllFactureItems, 
  getFactureById,
  createFacture,
  updateFactureById, 
  deleteFactureById,
  generateFacturePDF,
  uploadLogo,
  getLogo,
  upload
} = require("../controllers/factureController");

// Get all facture items
router.get("/get-factures", getAllFactureItems);

// Get facture by ID
router.get("/get-factures/:id", getFactureById);

// Create new facture
router.post("/create-facture", createFacture);

// Update a facture by _id
router.put("/update-facture/:id", updateFactureById);

// Delete a facture by _id
router.delete("/delete-facture/:id", deleteFactureById);

// Generate PDF for facture
router.get("/facture-pdf/:id", generateFacturePDF);

// Upload logo for facture
router.post('/facture/upload-logo', upload.single('logo'), uploadLogo);

// Get uploaded logo
router.get('/facture/logo/:logoName', getLogo);

module.exports = router;
