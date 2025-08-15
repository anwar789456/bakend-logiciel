const { Agenda, initModel } = require('../models/agendaModel');

// Get all agenda events
const getAllEvents = async (req, res) => {
    try {
        const agendaModel = initModel();
        const events = await agendaModel.find();
        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Error fetching events', error: error.message });
    }
};

// Create a new event
const createEvent = async (req, res) => {
    try {
        const agendaModel = initModel();
        const { 
            event,
            date_event_start,
            date_event_end
        } = req.body;

        // Validate required fields
        if (!event || !date_event_start || !date_event_end) {
            return res.status(400).json({ message: 'Event name, start date, and end date are required fields' });
        }

        // Validate that end date is after start date
        if (new Date(date_event_end) <= new Date(date_event_start)) {
            return res.status(400).json({ message: 'End date must be after start date' });
        }

        const newEvent = new agendaModel({
            event,
            date_event_start,
            date_event_end
        });

        const savedEvent = await newEvent.save();
        res.status(201).json(savedEvent);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ message: 'Error creating event', error: error.message });
    }
};

// Get an event by ID
const getEventById = async (req, res) => {
    try {
        const agendaModel = initModel();
        const event = await agendaModel.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.status(200).json(event);
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ message: 'Error fetching event', error: error.message });
    }
};

// Update an event by ID
const updateEventById = async (req, res) => {
    try {
        const agendaModel = initModel();
        const { 
            event,
            date_event_start,
            date_event_end
        } = req.body;
        
        // Validate that end date is after start date if both are provided
        if (date_event_start && date_event_end && new Date(date_event_end) <= new Date(date_event_start)) {
            return res.status(400).json({ message: 'End date must be after start date' });
        }

        const updatedEvent = await agendaModel.findByIdAndUpdate(
            req.params.id,
            {
                event,
                date_event_start,
                date_event_end
            },
            { new: true, runValidators: true }
        );

        if (!updatedEvent) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.status(200).json(updatedEvent);
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ message: 'Error updating event', error: error.message });
    }
};

// Delete an event by ID
const deleteEventById = async (req, res) => {
    try {
        const agendaModel = initModel();
        const event = await agendaModel.findByIdAndDelete(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.status(200).json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ message: 'Error deleting event', error: error.message });
    }
};

// Get events by date range
const getEventsByDateRange = async (req, res) => {
    try {
        const agendaModel = initModel();
        const { start_date, end_date } = req.query;
        
        if (!start_date || !end_date) {
            return res.status(400).json({ message: 'Start date and end date are required' });
        }

        const events = await agendaModel.find({
            $or: [
                // Events that start within the range
                {
                    date_event_start: {
                        $gte: new Date(start_date),
                        $lte: new Date(end_date)
                    }
                },
                // Events that end within the range
                {
                    date_event_end: {
                        $gte: new Date(start_date),
                        $lte: new Date(end_date)
                    }
                },
                // Events that span the entire range
                {
                    date_event_start: { $lte: new Date(start_date) },
                    date_event_end: { $gte: new Date(end_date) }
                }
            ]
        });

        res.status(200).json(events);
    } catch (error) {
        console.error('Error fetching events by date range:', error);
        res.status(500).json({ message: 'Error fetching events by date range', error: error.message });
    }
};

module.exports = {
    getAllEvents,
    createEvent,
    getEventById,
    updateEventById,
    deleteEventById,
    getEventsByDateRange
};