const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
    medicine_name: {
        type: String,
        required: [true, 'Please provide medicine name'],
        trim: true,
        maxlength: 100
    },
    category: {
        type: String,
        enum: ['Antibiotic', 'Antiparasitic', 'Supplement', 'Pesticide', 'Antifungal', 'Anti-inflammatory', 'Vaccine', 'Other'],
        required: [true, 'Please select category']
    },
    manufacturer: {
        type: String,
        trim: true,
        default: null
    },
    batch_number: {
        type: String,
        trim: true,
        default: null
    },
    expiry_date: {
        type: Date,
        required: [true, 'Please provide expiry date']
    },
    quantity: {
        type: Number,
        required: [true, 'Please provide quantity'],
        default: 0,
        min: [0, 'Quantity cannot be negative']
    },
    unit_price: {
        type: Number,
        required: [true, 'Please provide unit price'],
        min: [0, 'Price cannot be negative']
    },
    description: {
        type: String,
        default: null
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
}, { collection: 'medicines' });

// Index for common searches
medicineSchema.index({ medicine_name: 'text', category: 1 });
medicineSchema.index({ expiry_date: 1 });

module.exports = mongoose.model('Medicine', medicineSchema);
