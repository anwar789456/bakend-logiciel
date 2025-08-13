const userModel = require('../models/userModel');

// Helper function to get the initialized model
const getUserModel = () => {
    return userModel.initModel();
};

// Get all users
const getAllUsers = async (req, res) => {
    try {
        const User = getUserModel();
        const users = await User.find({});
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

// Create a new user
const createUser = async (req, res) => {
    try {
        const { userID, username, password, role, img_url } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }
        
        const User = getUserModel();
        const newUser = new User({
            userID,
            username,
            password, // Note: In a production environment, you should hash passwords
            role,
            img_url
        });
        
        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
};

// Get a user by ID
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const User = getUserModel();
        const user = await User.findById(id);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
};

// Update a user by ID
const updateUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const { userID, username, password, role, img_url } = req.body;
        
        const User = getUserModel();
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { userID, username, password, role, img_url },
            { new: true, runValidators: true }
        );
        
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
};

// Delete a user by ID
const deleteUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const User = getUserModel();
        const deletedUser = await User.findByIdAndDelete(id);
        
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
};

module.exports = {
    getAllUsers,
    createUser,
    getUserById,
    updateUserById,
    deleteUserById
};