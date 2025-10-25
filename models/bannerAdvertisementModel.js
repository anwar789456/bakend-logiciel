const mongoose = require('mongoose');
const { getConnections } = require('../config/db');

const bannerAdvertisementSchema = new mongoose.Schema({
    title: { type: String },
    animation: { type: String },
    link_to: { type: String },
    background_color: { type: String },
    font_color: { type: String },
    display: { type: String }
}, { timestamps: true });

// This model will be initialized after the database connections are established
let BannerAdvertisement;

// Function to initialize the model with the appropriate connection
const initModel = () => {
    const { conn2 } = getConnections();
    if (!BannerAdvertisement && conn2) {
        BannerAdvertisement = conn2.model('BannerAdvertisement', bannerAdvertisementSchema, 'banner_advertisement');
    }
    return BannerAdvertisement;
};

// Export both the model initialization function and the model
module.exports = {
    BannerAdvertisement: null, // Will be set by initModel
    initModel: function() {
        const model = initModel();
        this.BannerAdvertisement = model;
        return model;
    }
};
