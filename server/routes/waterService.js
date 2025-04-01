const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const WaterService = require('../models/WaterService');

// Validation middleware
const validateWaterService = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('location.latitude').isFloat().withMessage('Valid latitude is required'),
    body('location.longitude').isFloat().withMessage('Valid longitude is required'),
    body('type').isIn(['water_treatment', 'distribution', 'collection']).withMessage('Valid service type is required')
];

// Get all water services
router.get('/', async (req, res) => {
    try {
        const services = await WaterService.find();
        res.json(services);
    } catch (error) {
        console.error('Error fetching water services:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get water service by ID
router.get('/:id', async (req, res) => {
    try {
        const service = await WaterService.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ message: 'Water service not found' });
        }
        res.json(service);
    } catch (error) {
        console.error('Error fetching water service:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new water service (admin only)
router.post('/', [auth, validateWaterService], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, location, type, description, capacity } = req.body;

        const service = new WaterService({
            name,
            location,
            type,
            description,
            capacity
        });

        await service.save();
        res.status(201).json(service);
    } catch (error) {
        console.error('Error creating water service:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update water service (admin only)
router.put('/:id', [auth, validateWaterService], async (req, res) => {
    try {
        const service = await WaterService.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ message: 'Water service not found' });
        }

        const { name, location, type, description, capacity } = req.body;

        service.name = name;
        service.location = location;
        service.type = type;
        service.description = description;
        service.capacity = capacity;

        await service.save();
        res.json(service);
    } catch (error) {
        console.error('Error updating water service:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete water service (admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        const service = await WaterService.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ message: 'Water service not found' });
        }

        await service.remove();
        res.json({ message: 'Water service deleted successfully' });
    } catch (error) {
        console.error('Error deleting water service:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get water service status
router.get('/:id/status', async (req, res) => {
    try {
        const service = await WaterService.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ message: 'Water service not found' });
        }

        res.json({
            status: service.status,
            lastMaintenance: service.lastMaintenance,
            nextMaintenance: service.nextMaintenance,
            capacity: service.capacity,
            currentUsage: service.currentUsage
        });
    } catch (error) {
        console.error('Error fetching service status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update water service status (admin only)
router.patch('/:id/status', auth, async (req, res) => {
    try {
        const service = await WaterService.findById(req.params.id);
        if (!service) {
            return res.status(404).json({ message: 'Water service not found' });
        }

        const { status, currentUsage } = req.body;

        service.status = status;
        service.currentUsage = currentUsage;

        await service.save();
        res.json(service);
    } catch (error) {
        console.error('Error updating service status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 