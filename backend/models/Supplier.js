const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    supplier_name: {
        type: String,
        required: [true, 'Please provide supplier name'],
        trim: true,
        maxlength: 100
    },
    phone: {
        type: String,
        required: [true, 'Please provide phone number'],
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        default: null,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$|^$/, 'Please provide valid email']
    },
    address: {
        type: String,
        trim: true,
        default: null
    },
    contact_person: {
        type: String,
        trim: true,
        default: null
    },
    payment_terms: {
        type: String,
        default: 'Net 30'
    },
    is_active: {
        type: Boolean,
        default: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
}, { collection: 'suppliers' });

// Index for searches
supplierSchema.index({ supplier_name: 'text', email: 1, phone: 1 });

module.exports = mongoose.model('Supplier', supplierSchema);
