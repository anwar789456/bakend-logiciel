const mongoose = require('mongoose');
const BannerAdvertisementModel = require('../models/bannerAdvertisementModel');

// Helper function to get the initialized model
const getBannerAdvertisementModel = () => {
    return BannerAdvertisementModel.initModel();
};

// Get the banner advertisement (always returns the single document)
const getBannerAdvertisement = async (req, res) => {
    try {
        const BannerAdvertisement = getBannerAdvertisementModel();
        const banner = await BannerAdvertisement.findOne({});
        
        if (!banner) {
            return res.status(404).json({ message: 'Banner advertisement not found. Please create one first.' });
        }
        
        res.status(200).json(banner);
    } catch (error) {
        console.error('Error fetching banner advertisement:', error);
        res.status(500).json({ message: 'Error fetching banner advertisement', error: error.message });
    }
};

// Create or update the banner advertisement (upsert operation)
const upsertBannerAdvertisement = async (req, res) => {
    try {
        const { title, animation, link_to, background_color, font_color, display } = req.body;
        
        // Validate required fields
        if (!title || !animation || !link_to || !background_color || !font_color || !display) {
            return res.status(400).json({ 
                message: 'All fields are required: title, animation, link_to, background_color, font_color, display' 
            });
        }
        
        const BannerAdvertisement = getBannerAdvertisementModel();
        
        // Find the existing document or create a new one
        const banner = await BannerAdvertisement.findOne({});
        
        if (banner) {
            // Update existing document
            banner.title = title;
            banner.animation = animation;
            banner.link_to = link_to;
            banner.background_color = background_color;
            banner.font_color = font_color;
            banner.display = display;
            
            const updatedBanner = await banner.save();
            res.status(200).json({ 
                message: 'Banner advertisement updated successfully', 
                data: updatedBanner 
            });
        } else {
            // Create new document
            const newBanner = new BannerAdvertisement({
                title,
                animation,
                link_to,
                background_color,
                font_color,
                display
            });
            
            const savedBanner = await newBanner.save();
            res.status(201).json({ 
                message: 'Banner advertisement created successfully', 
                data: savedBanner 
            });
        }
    } catch (error) {
        console.error('Error upserting banner advertisement:', error);
        res.status(500).json({ message: 'Error upserting banner advertisement', error: error.message });
    }
};

// Update specific fields of the banner advertisement
const updateBannerAdvertisement = async (req, res) => {
    try {
        const updateFields = req.body;
        
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ message: 'No fields provided for update' });
        }
        
        const BannerAdvertisement = getBannerAdvertisementModel();
        const banner = await BannerAdvertisement.findOne({});
        
        if (!banner) {
            return res.status(404).json({ message: 'Banner advertisement not found. Please create one first.' });
        }
        
        // Update only the provided fields
        Object.keys(updateFields).forEach(key => {
            if (banner.schema.paths[key]) {
                banner[key] = updateFields[key];
            }
        });
        
        const updatedBanner = await banner.save();
        res.status(200).json({ 
            message: 'Banner advertisement updated successfully', 
            data: updatedBanner 
        });
    } catch (error) {
        console.error('Error updating banner advertisement:', error);
        res.status(500).json({ message: 'Error updating banner advertisement', error: error.message });
    }
};

module.exports = {
    getBannerAdvertisement,
    upsertBannerAdvertisement,
    updateBannerAdvertisement
};
