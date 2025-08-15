const mongoose = require('mongoose');
const { getConnections } = require('../config/db');

const employeeSchema = new mongoose.Schema({
    nom_prenom: String,
    date_naiss: Date,
    date_recrutement: Date,
    nom_post: String,
    descriptif_post: String,
    type_contrat: String,
    lien_cv: String,
    image_profil: String,
    remuneration: String
}, { timestamps: true });

// This model will be initialized after the database connections are established
let Employee;

// Function to initialize the model with the appropriate connection
const initModel = () => {
    const { conn2 } = getConnections();
    if (!Employee && conn2) {
        Employee = conn2.model('employee', employeeSchema, 'employees');
    }
    return Employee;
};

// Export both the model initialization function and the model
module.exports = {
    Employee: null, // Will be set by initModel
    initModel: function() {
        const model = initModel();
        this.Employee = model;
        return model;
    }
};