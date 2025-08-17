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
router.get('/admin/api/logiciel/get-demandes-conge', getAllDemandeConges);
router.post('/admin/api/logiciel/create-demande-conge', createDemandeConge);
router.get('/admin/api/logiciel/get-demande-conge/:id', getDemandeCongeById);
router.put('/admin/api/logiciel/update-demande-conge/:id', updateDemandeCongeById);
router.delete('/admin/api/logiciel/delete-demande-conge/:id', deleteDemandeCongeById);

module.exports = router;