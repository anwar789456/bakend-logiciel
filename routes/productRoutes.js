const express = require("express");
const router = express.Router();

// Import controller functions
const { getAllProductItems, deleteProductById, updateProductById } = require("../controllers/productController");

// Get all product items
router.get("/admin/api/get-products", getAllProductItems);

// Delete a product by _id
router.delete("/admin/api/delete-product/:id", deleteProductById);

// Update a product by _id
router.put("/admin/api/update-product/:id", updateProductById);

module.exports = router;