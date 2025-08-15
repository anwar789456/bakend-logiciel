const { Employee, initModel } = require('../models/employeeModel');

// Initialize the model
const employeeModel = initModel();

// Get all employees
const getAllEmployees = async (req, res) => {
    try {
        const employees = await employeeModel.find();
        res.status(200).json(employees);
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ message: 'Error fetching employees', error: error.message });
    }
};

// Create a new employee
const createEmployee = async (req, res) => {
    try {
        const { 
            nom_prenom, 
            date_naiss, 
            date_recrutement, 
            nom_post, 
            descriptif_post, 
            type_contrat, 
            lien_cv, 
            image_profil, 
            remuneration 
        } = req.body;

        // Validate required fields
        if (!nom_prenom || !nom_post) {
            return res.status(400).json({ message: 'Name and position are required fields' });
        }

        const newEmployee = new employeeModel({
            nom_prenom, 
            date_naiss, 
            date_recrutement, 
            nom_post, 
            descriptif_post, 
            type_contrat, 
            lien_cv, 
            image_profil, 
            remuneration
        });

        const savedEmployee = await newEmployee.save();
        res.status(201).json(savedEmployee);
    } catch (error) {
        console.error('Error creating employee:', error);
        res.status(500).json({ message: 'Error creating employee', error: error.message });
    }
};

// Get an employee by ID
const getEmployeeById = async (req, res) => {
    try {
        const employee = await employeeModel.findById(req.params.id);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.status(200).json(employee);
    } catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).json({ message: 'Error fetching employee', error: error.message });
    }
};

// Update an employee by ID
const updateEmployeeById = async (req, res) => {
    try {
        const { 
            nom_prenom, 
            date_naiss, 
            date_recrutement, 
            nom_post, 
            descriptif_post, 
            type_contrat, 
            lien_cv, 
            image_profil, 
            remuneration 
        } = req.body;
        
        const updatedEmployee = await employeeModel.findByIdAndUpdate(
            req.params.id,
            {
                nom_prenom, 
                date_naiss, 
                date_recrutement, 
                nom_post, 
                descriptif_post, 
                type_contrat, 
                lien_cv, 
                image_profil, 
                remuneration
            },
            { new: true, runValidators: true }
        );

        if (!updatedEmployee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        res.status(200).json(updatedEmployee);
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).json({ message: 'Error updating employee', error: error.message });
    }
};

// Delete an employee by ID
const deleteEmployeeById = async (req, res) => {
    try {
        const employee = await employeeModel.findByIdAndDelete(req.params.id);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }
        res.status(200).json({ message: 'Employee deleted successfully' });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ message: 'Error deleting employee', error: error.message });
    }
};

module.exports = {
    getAllEmployees,
    createEmployee,
    getEmployeeById,
    updateEmployeeById,
    deleteEmployeeById
};