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
  uploadLogo,
  getLogo,
  upload
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

// Upload logo for devis
router.post("/upload-logo", upload.single('logo'), uploadLogo);

// Get uploaded logo
router.get("/logo/:logoName", getLogo);

module.exports = router;