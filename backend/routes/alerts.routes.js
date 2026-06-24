const express = require('express');
const { authenticate } = require('../middleware/auth');
const Alert = require('../models/Alert');

const router = express.Router();

// Get all alerts
router.get('/', authenticate, async (req, res) => {
    try {
        const { status, alert_type, limit } = req.query;
        let query = {};

        if (status) query.status = status;
        if (alert_type) query.alert_type = alert_type;

        const alerts = await Alert.find(query)
            .populate('medicine_id')
            .sort({ created_at: -1 })
            .limit(limit ? parseInt(limit) : 0);

        const unreadCount = await Alert.countDocuments({ status: 'unread' });

        res.json({
            status: 'success',
            count: alerts.length,
            unreadCount,
            alerts
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Get alert by ID
router.get('/:id', authenticate, async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id).populate('medicine_id');

        if (!alert) {
            return res.status(404).json({
                status: 'error',
                message: 'Alert not found'
            });
        }

        res.json({
            status: 'success',
            alert
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Mark alert as read
router.patch('/:id/read', authenticate, async (req, res) => {
    try {
        const alert = await Alert.findByIdAndUpdate(
            req.params.id,
            { status: 'read', read_at: Date.now() },
            { new: true }
        ).populate('medicine_id');

        if (!alert) {
            return res.status(404).json({
                status: 'error',
                message: 'Alert not found'
            });
        }

        res.json({
            status: 'success',
            message: 'Alert marked as read',
            alert
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Mark all alerts as read
router.patch('/all/read', authenticate, async (req, res) => {
    try {
        await Alert.updateMany(
            { status: 'unread' },
            { status: 'read', read_at: Date.now() }
        );

        res.json({
            status: 'success',
            message: 'All alerts marked as read'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Archive alert
router.patch('/:id/archive', authenticate, async (req, res) => {
    try {
        const alert = await Alert.findByIdAndUpdate(
            req.params.id,
            { status: 'archived' },
            { new: true }
        );

        if (!alert) {
            return res.status(404).json({
                status: 'error',
                message: 'Alert not found'
            });
        }

        res.json({
            status: 'success',
            message: 'Alert archived',
            alert
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

module.exports = router;
