const express = require('express');
const router = express.Router();

// Import controller functions
const {
    getBannerAdvertisement,
    upsertBannerAdvertisement,
    updateBannerAdvertisement
} = require('../controllers/bannerAdvertisementController');

// Get the banner advertisement
router.get('/admin/api/logiciel/get-banner-advertisement', getBannerAdvertisement);

// Create or update the banner advertisement (full replacement)
router.post('/admin/api/logiciel/upsert-banner-advertisement', upsertBannerAdvertisement);

// Update specific fields of the banner advertisement
router.patch('/admin/api/logiciel/update-banner-advertisement', updateBannerAdvertisement);

module.exports = router;
