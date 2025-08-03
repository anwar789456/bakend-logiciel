const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');

router.get('/admin/api/info', backupController.getBackupInfo);
router.post('/admin/api/export', backupController.exportCollections);

module.exports = router;
