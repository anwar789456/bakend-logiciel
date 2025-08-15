const express = require('express');
const router = express.Router();
const {
    getAllEvents,
    createEvent,
    getEventById,
    updateEventById,
    deleteEventById,
    getEventsByDateRange
} = require('../controllers/agendaController');

// Get all events
router.get('/admin/api/logiciel/agenda', getAllEvents);

// Create a new event
router.post('/admin/api/logiciel/agenda', createEvent);

// Get events by date range
router.get('/admin/api/logiciel/agenda/range', getEventsByDateRange);

// Get, update, or delete an event by ID
router.get('/admin/api/logiciel/agenda/:id', getEventById);
router.put('/admin/api/logiciel/agenda/:id', updateEventById);
router.delete('/admin/api/logiciel/agenda/:id', deleteEventById);

module.exports = router;