const express = require('express');
const router = express.Router();
const {
    getAllEmployees,
    createEmployee,
    getEmployeeById,
    updateEmployeeById,
    deleteEmployeeById
} = require('../controllers/employeeController');

// Define routes
router.get('/admin/api/logiciel/employees', getAllEmployees);
router.post('/admin/api/logiciel/employees', createEmployee);
router.get('/admin/api/logiciel/employees/:id', getEmployeeById);
router.put('/admin/api/logiciel/employees/:id', updateEmployeeById);
router.delete('/admin/api/logiciel/employees/:id', deleteEmployeeById);

module.exports = router;