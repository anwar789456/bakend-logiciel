const { Agenda, initModel } = require('../models/agendaModel');

// Helper function to get the initialized model
const getAgendaModel = () => {
    return initModel();
};

// Get all agenda events
const getAllEvents = async (req, res) => {
    try {
        const AgendaModel = getAgendaModel();
        const events = await AgendaModel.find({}).sort({ date_event_start: 1 });
        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching agenda events:', error);
        res.status(500).json({ message: 'Error fetching agenda events', error: error.message });
    }
};

// Create a new agenda event
const createEvent = async (req, res) => {
    try {
        const { event, date_event_start, date_event_end } = req.body;
        
        if (!event || !date_event_start || !date_event_end) {
            return res.status(400).json({ message: 'Event name, start date, and end date are required' });
        }
        
        const AgendaModel = getAgendaModel();
        const newEvent = new AgendaModel({
            event,
            date_event_start,
            date_event_end
        });
        
        const savedEvent = await newEvent.save();
        res.status(201).json(savedEvent);
    } catch (error) {
        console.error('Error creating agenda event:', error);
        res.status(500).json({ message: 'Error creating agenda event', error: error.message });
    }
};

// Update an agenda event by ID
const updateEventById = async (req, res) => {
    try {
        const { id } = req.params;
        const { event, date_event_start, date_event_end } = req.body;
        
        if (!event || !date_event_start || !date_event_end) {
            return res.status(400).json({ message: 'Event name, start date, and end date are required' });
        }
        
        const AgendaModel = getAgendaModel();
        const updatedEvent = await AgendaModel.findByIdAndUpdate(
            id,
            { event, date_event_start, date_event_end },
            { new: true, runValidators: true }
        );
        
        if (!updatedEvent) {
            return res.status(404).json({ message: 'Agenda event not found' });
        }
        
        res.status(200).json(updatedEvent);
    } catch (error) {
        console.error('Error updating agenda event:', error);
        res.status(500).json({ message: 'Error updating agenda event', error: error.message });
    }
};

// Delete an agenda event by ID
const deleteEventById = async (req, res) => {
    try {
        const { id } = req.params;
        const AgendaModel = getAgendaModel();
        const deletedEvent = await AgendaModel.findByIdAndDelete(id);
        
        if (!deletedEvent) {
            return res.status(404).json({ message: 'Agenda event not found' });
        }
        
        res.status(200).json({ message: 'Agenda event deleted successfully' });
    } catch (error) {
        console.error('Error deleting agenda event:', error);
        res.status(500).json({ message: 'Error deleting agenda event', error: error.message });
    }
};

module.exports = {
    getAllEvents,
    createEvent,
    updateEventById,
    deleteEventById
};