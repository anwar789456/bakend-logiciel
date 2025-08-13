const express = require('express');
const router = express.Router();
const {
    getAllDemandeConges,
    createDemandeConge,
    getDemandeCongeById,
    updateDemandeCongeById,
    deleteDemandeCongeById
} = require('../controllers/demandeCongeController');

// Define routes
router.get('/api/demandeConges', getAllDemandeConges);
router.post('/api/demandeConges', createDemandeConge);
router.get('/api/demandeConges/:id', getDemandeCongeById);
router.put('/api/demandeConges/:id', updateDemandeCongeById);
router.delete('/api/demandeConges/:id', deleteDemandeCongeById);

module.exports = router;