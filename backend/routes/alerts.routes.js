const express = require('express');
const { authenticate } = require('../middleware/auth');
const Alert = require('../models/Alert');
const supabaseClient = require('../supabase/client');
const fallbackStore = require('../config/fallback-store');

const router = express.Router();
const supabaseConfigured = Boolean(
    supabaseClient
    && supabaseClient.from
    && supabaseClient.supabaseUrl
    && (supabaseClient.supabaseServiceRoleKey || supabaseClient.supabaseAnonKey)
    && !String(supabaseClient.supabaseServiceRoleKey || supabaseClient.supabaseAnonKey).includes('replace_with')
);

async function enrichAlert(alert) {
    if (!alert) return alert;
    const { data: medicine } = await supabaseClient.from('medicines').select('*').eq('id', alert.medicine_id).maybeSingle();
    return { ...alert, medicine_id: medicine || null };
}

// Get all alerts
router.get('/', authenticate, async (req, res) => {
    try {
        if (supabaseConfigured) {
            const { status, alert_type, limit } = req.query;
            let query = supabaseClient.from('alerts').select('*').order('created_at', { ascending: false });
            if (status) query = query.eq('status', status);
            if (alert_type) query = query.eq('alert_type', alert_type);
            if (limit) query = query.limit(Number(limit));

            const { data, error } = await query;
            if (error) throw error;
            const alerts = await Promise.all((data || []).map(enrichAlert));
            const unreadCount = alerts.filter((alert) => alert.status !== 'read').length;
            return res.json({ status: 'success', count: alerts.length, unreadCount, alerts });
        }

        if (!req.app.locals.dbConnected) {
            const alerts = fallbackStore.listItems('alerts', req.query);
            const unreadCount = alerts.filter((alert) => alert.status !== 'read').length;
            return res.json({ status: 'success', count: alerts.length, unreadCount, alerts });
        }

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
        if (supabaseConfigured) {
            const { data, error } = await supabaseClient.from('alerts').select('*').eq('id', req.params.id).maybeSingle();
            if (error) throw error;
            if (!data) {
                return res.status(404).json({ status: 'error', message: 'Alert not found' });
            }
            const alert = await enrichAlert(data);
            return res.json({ status: 'success', alert });
        }

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
        if (supabaseConfigured) {
            const { data, error } = await supabaseClient.from('alerts').update({ status: 'read', read_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', req.params.id).select('*').single();
            if (error) throw error;
            const alert = await enrichAlert(data);
            return res.json({ status: 'success', message: 'Alert marked as read', alert });
        }

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
        if (supabaseConfigured) {
            const { error } = await supabaseClient.from('alerts').update({ status: 'read', read_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('status', 'unread');
            if (error) throw error;
            return res.json({ status: 'success', message: 'All alerts marked as read' });
        }

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
        if (supabaseConfigured) {
            const { data, error } = await supabaseClient.from('alerts').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('id', req.params.id).select('*').single();
            if (error) throw error;
            const alert = await enrichAlert(data);
            return res.json({ status: 'success', message: 'Alert archived', alert });
        }

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
