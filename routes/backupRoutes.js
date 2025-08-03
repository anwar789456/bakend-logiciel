const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');

router.get('/admin/api/logiciel/info', backupController.getBackupInfo);
router.post('/admin/api/logiciel/export', backupController.exportCollections);

module.exports = router;
