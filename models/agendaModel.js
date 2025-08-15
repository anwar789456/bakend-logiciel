const mongoose = require('mongoose');
const { getConnections } = require('../config/db');

const agendaSchema = new mongoose.Schema({
    event: String,
    date_event_start: Date,
    date_event_end: Date
}, { timestamps: true });

// This model will be initialized after the database connections are established
let Agenda;

// Function to initialize the model with the appropriate connection
const initModel = () => {
    const { conn2 } = getConnections();
    if (!Agenda && conn2) {
        Agenda = conn2.model('agenda', agendaSchema, 'agendas');
    }
    return Agenda;
};

// Export both the model initialization function and the model
module.exports = {
    Agenda: null, // Will be set by initModel
    initModel: function() {
        const model = initModel();
        this.Agenda = model;
        return model;
    }
};