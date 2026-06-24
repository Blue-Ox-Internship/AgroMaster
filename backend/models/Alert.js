const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
    medicine_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicine',
        required: true
    },
    alert_type: {
        type: String,
        enum: ['low_stock', 'expiry', 'expired', 'system'],
        required: [true, 'Please provide alert type']
    },
    message: {
        type: String,
        required: [true, 'Please provide alert message']
    },
    severity: {
        type: String,
        enum: ['info', 'warning', 'danger'],
        default: 'warning'
    },
    status: {
        type: String,
        enum: ['unread', 'read', 'archived'],
        default: 'unread'
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    read_at: {
        type: Date,
        default: null
    }
}, { collection: 'alerts' });

// Index for common queries
alertSchema.index({ status: 1, created_at: -1 });
alertSchema.index({ medicine_id: 1 });

module.exports = mongoose.model('Alert', alertSchema);
