const express = require('express');
const router = express.Router();

// Import controller functions
const {
    getAllEvents,
    createEvent,
    updateEventById,
    deleteEventById
} = require('../controllers/agendaController');

// Get all agenda events
router.get('/admin/api/logiciel/get-all-agenda-events', getAllEvents);

// Create new agenda event
router.post('/admin/api/logiciel/create-agenda-event', createEvent);

// Update an agenda event by ID
router.put('/admin/api/logiciel/update-agenda-event/:id', updateEventById);

// Delete an agenda event by ID
router.delete('/admin/api/logiciel/delete-agenda-event/:id', deleteEventById);

module.exports = router;