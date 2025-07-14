const mongoose = require('mongoose');
const { getConnections } = require('../config/db');

const messageSchema = new mongoose.Schema({
    content: { type: String, },
    date: { type: Date, default: Date.now },
});

const chatSchema = new mongoose.Schema(
    {
      idClient: { type: Number, },
      nomPrenon: { type: String, },
      email: { type: String },
      telephone: { type: String },
      message: { type: [messageSchema] },
    },
    { timestamps: true }
);

// This model will be initialized after the database connections are established
let Chat;

// Function to initialize the model with the appropriate connection
const initModel = () => {
    const { conn2 } = getConnections();
    if (!Chat && conn2) {
        Chat = conn2.model('chatlogs', chatSchema);
    }
    return Chat;
};

// Export both the model initialization function and the model
module.exports = {
    Chat: null, // Will be set by initModel
    initModel: function() {
        const model = initModel();
        this.Chat = model;
        return model;
    }
};
