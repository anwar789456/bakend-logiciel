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
router.get('/admin/api/logiciel/get-all-employees', getAllEmployees);
router.post('/admin/api/logiciel/create-employees', createEmployee);
router.get('/admin/api/logiciel/employees/get-employe-by-id/:id', getEmployeeById);
router.put('/admin/api/logiciel/employees/update-employee/:id', updateEmployeeById);
router.delete('/admin/api/logiciel/employees/delete-employee/:id', deleteEmployeeById);

module.exports = router;