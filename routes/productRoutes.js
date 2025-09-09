const express = require("express");
const router = express.Router();

// Import controller functions
const { getAllProductItems, deleteProductById, updateProductById } = require("../controllers/productController");

// Get all product items
router.get("/admin/api/logiciel/get-products", getAllProductItems);

// Delete a product by _id
router.delete("/admin/api/logiciel/delete-product/:id", deleteProductById);

// Update a product by _id
router.put("/admin/api/logiciel/update-product/:id", updateProductById);

router.post("/admin/api/logiciel/add-product", addProduct);

module.exports = router;