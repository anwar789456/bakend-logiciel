const productModel = require("../models/productModel");
let Product = productModel.initModel();
// Get all product items
const getAllProductItems = async (req, res) => {
    try {
        const items = await Product.find();
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: "Error fetching Product items", error });
    }
};
// Delete a product by its _id
const deleteProductById = async (req, res) => {
    try {
        const { id } = req.params;  // Get the _id from the request parameters
        const product = await Product.findByIdAndDelete(id);  // Use findByIdAndDelete to delete by _id
        if (!product) {
            return res.status(404).json({ message: `Product with _id ${id} not found` });
        }
        res.status(200).json({ message: `Product with _id ${id} deleted successfully` });
    } catch (error) {
        res.status(500).json({ message: "Error deleting Product", error });
    }
};
// Update a product by its _id
const updateProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const updatedProduct = await Product.findByIdAndUpdate(id, updates,{ new: true, runValidators: true });
        if (!updatedProduct) {
            return res.status(404).json({ message: `Product with _id ${id} not found` });
        }
        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: "Error updating Product", error });
    }
};

const addProduct = async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        res.status(500).json({ message: "Error adding new product", error });
    }
};

module.exports = { getAllProductItems, deleteProductById, updateProductById, addProduct };