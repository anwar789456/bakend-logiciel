const mongoose = require('mongoose');
const { getConnections } = require('../config/db');

const userSchema = new mongoose.Schema({
    userID: String,
    username: String,
    password: String,
    role: String,
    img_url: String,
    access_routes: [String]
}, { timestamps: true });

// This model will be initialized after the database connections are established
let User;

// Function to initialize the model with the appropriate connection
const initModel = () => {
    const { conn2 } = getConnections();
    if (!User && conn2) {
        User = conn2.model('user', userSchema, 'users');
    }
    return User;
};

// Export both the model initialization function and the model
module.exports = {
    User: null, // Will be set by initModel
    initModel: function() {
        const model = initModel();
        this.User = model;
        return model;
    }
};