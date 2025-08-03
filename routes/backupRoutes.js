const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');

router.get('/info', backupController.getBackupInfo);
router.post('/export', backupController.exportCollections);

module.exports = router;
