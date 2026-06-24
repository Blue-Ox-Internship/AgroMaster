const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
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
    selling_price: {
        type: Number,
        required: [true, 'Please provide selling price'],
        min: [0, 'Price cannot be negative']
    },
    total_amount: {
        type: Number,
        default: function () {
            return this.quantity * this.selling_price;
        }
    },
    sale_date: {
        type: Date,
        required: [true, 'Please provide sale date'],
        default: Date.now
    },
    customer_name: {
        type: String,
        trim: true,
        default: null
    },
    payment_method: {
        type: String,
        enum: ['Cash', 'Mobile Money', 'Bank Transfer', 'Credit'],
        default: 'Cash'
    },
    notes: {
        type: String,
        default: null
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
}, { collection: 'sales' });

// Index for common queries
saleSchema.index({ medicine_id: 1, sale_date: -1 });
saleSchema.index({ sale_date: -1 });
saleSchema.index({ created_by: 1 });

module.exports = mongoose.model('Sale', saleSchema);
