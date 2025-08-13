const express = require('express');
const router = express.Router();

// Import controller functions
const { getAllUsers, createUser, getUserById, updateUserById, deleteUserById } = require('../controllers/userController');

// Get all users
router.get('/admin/api/logiciel/get-users', getAllUsers);

// Get user by ID
router.get('/admin/api/logiciel/get-user/:id', getUserById);

// Create new user
router.post('/admin/api/logiciel/create-user', createUser);

// Update a user by _id
router.put('/admin/api/logiciel/update-user/:id', updateUserById);

// Delete a user by _id
router.delete('/admin/api/logiciel/delete-user/:id', deleteUserById);

module.exports = router;