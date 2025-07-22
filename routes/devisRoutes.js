const express = require("express");
const router = express.Router();

// Import controller functions
const { getAllDevisItems, deleteDevisById, updateDevisById } = require("../controllers/devisController");

// Get all devis items
router.get("/admin/api/get-devis", getAllDevisItems);

// Delete a devis by _id
router.delete("/admin/api/delete-devis/:id", deleteDevisById);

// Update a devis by _id
router.put("/admin/api/update-devis/:id", updateDevisById);

module.exports = router;