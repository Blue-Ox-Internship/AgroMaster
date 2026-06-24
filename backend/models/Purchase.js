const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
    supplier_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: [true, 'Please provide supplier']
    },
    medicine_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicine',
        required: [true, 'Please provide medicine']
    },
    quantity: {
        type: Number,
        required: [true, 'Please provide quantity'],
        min: [1, 'Quantity must be at least 1']
    },
    buying_price: {
        type: Number,
        required: [true, 'Please provide buying price'],
        min: [0, 'Price cannot be negative']
    },
    total_cost: {
        type: Number,
        default: function () {
            return this.quantity * this.buying_price;
        }
    },
    purchase_date: {
        type: Date,
        required: [true, 'Please provide purchase date'],
        default: Date.now
    },
    invoice_number: {
        type: String,
        trim: true,
        default: null
    },
    notes: {
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
}, { collection: 'purchases' });

// Index for common queries
purchaseSchema.index({ supplier_id: 1, purchase_date: -1 });
purchaseSchema.index({ medicine_id: 1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
