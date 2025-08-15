const mongoose = require('mongoose');
const { getConnections } = require('../config/db');
const employeeSchema = new mongoose.Schema({
    userID: String,
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
let Employee;
const initModel = () => {
    const { conn2 } = getConnections();
    if (!Employee && conn2) {
        Employee = conn2.model('employee', employeeSchema, 'employees');
    }
    return Employee;
};
module.exports = {
    Employee: null,
    initModel: function() {
        const model = initModel();
        this.Employee = model;
        return model;
    }
};