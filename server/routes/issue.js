const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Issue = require('../models/Issue');
const WaterService = require('../models/WaterService');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/issues');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // 5MB limit
    fileFilter: function(req, file, cb) {
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb('Error: Images Only!');
        }
    }
});

// Validation middleware
const validateIssue = [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('type').isIn(['leak', 'water_quality', 'pressure', 'other']).withMessage('Valid issue type is required'),
    body('priority').isIn(['low', 'medium', 'high', 'urgent']).withMessage('Valid priority is required'),
    body('location.latitude').isFloat().withMessage('Valid latitude is required'),
    body('location.longitude').isFloat().withMessage('Valid longitude is required')
];

// Get all issues
router.get('/', auth, async (req, res) => {
    try {
        const issues = await Issue.find()
            .populate('reportedBy', 'name email')
            .populate('assignedTo', 'name email')
            .populate('waterService', 'name type')
            .sort({ createdAt: -1 });
        res.json(issues);
    } catch (error) {
        console.error('Error fetching issues:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get issue by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id)
            .populate('reportedBy', 'name email')
            .populate('assignedTo', 'name email')
            .populate('waterService', 'name type')
            .populate('comments.user', 'name email');

        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }
        res.json(issue);
    } catch (error) {
        console.error('Error fetching issue:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new issue
router.post('/', [auth, validateIssue, upload.array('photos', 5)], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { title, description, type, priority, location } = req.body;

        // Find nearest water service
        const nearestService = await WaterService.findNearby(
            location.latitude,
            location.longitude,
            5000 // 5km radius
        ).limit(1);

        const issue = new Issue({
            title,
            description,
            type,
            priority,
            location,
            reportedBy: req.user.id,
            waterService: nearestService[0]?._id
        });

        // Handle photo uploads
        if (req.files) {
            issue.photos = req.files.map(file => ({
                url: `/uploads/issues/${file.filename}`,
                caption: ''
            }));
        }

        await issue.save();
        res.status(201).json(issue);
    } catch (error) {
        console.error('Error creating issue:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update issue status
router.patch('/:id/status', auth, async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id);
        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        const { status, resolutionDescription } = req.body;

        await issue.updateStatus(status, req.user.id);
        if (resolutionDescription) {
            issue.resolution.description = resolutionDescription;
            await issue.save();
        }

        res.json(issue);
    } catch (error) {
        console.error('Error updating issue status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add comment to issue
router.post('/:id/comments', auth, async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id);
        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        const { text } = req.body;
        await issue.addComment(req.user.id, text);

        res.json(issue);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Assign issue to user
router.patch('/:id/assign', auth, async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id);
        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        const { assignedTo } = req.body;
        issue.assignedTo = assignedTo;
        issue.status = 'assigned';
        await issue.save();

        res.json(issue);
    } catch (error) {
        console.error('Error assigning issue:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get issues by status
router.get('/status/:status', auth, async (req, res) => {
    try {
        const issues = await Issue.findByStatus(req.params.status)
            .populate('reportedBy', 'name email')
            .populate('assignedTo', 'name email')
            .populate('waterService', 'name type');
        res.json(issues);
    } catch (error) {
        console.error('Error fetching issues by status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get issues by priority
router.get('/priority/:priority', auth, async (req, res) => {
    try {
        const issues = await Issue.findByPriority(req.params.priority)
            .populate('reportedBy', 'name email')
            .populate('assignedTo', 'name email')
            .populate('waterService', 'name type');
        res.json(issues);
    } catch (error) {
        console.error('Error fetching issues by priority:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 