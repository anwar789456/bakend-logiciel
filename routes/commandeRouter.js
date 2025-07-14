const express = require("express");
const router = express.Router();

const { getAllCommandeItems } = require("../controllers/commandeController");

// Get all commande items
router.get("/admin/api/get-commande", getAllCommandeItems);

module.exports = router;