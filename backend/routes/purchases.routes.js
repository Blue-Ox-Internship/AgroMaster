const express = require('express');
const { authenticate } = require('../middleware/auth');
const Purchase = require('../models/Purchase');
const Medicine = require('../models/Medicine');

const router = express.Router();

// Get all purchases
router.get('/', authenticate, async (req, res) => {
    try {
        const { supplier_id, medicine_id, from, to } = req.query;
        let query = {};

        if (supplier_id) query.supplier_id = supplier_id;
        if (medicine_id) query.medicine_id = medicine_id;

        if (from || to) {
            query.purchase_date = {};
            if (from) query.purchase_date.$gte = new Date(from);
            if (to) query.purchase_date.$lte = new Date(to);
        }

        const purchases = await Purchase.find(query)
            .populate('supplier_id')
            .populate('medicine_id')
            .sort({ purchase_date: -1 });

        res.json({
            status: 'success',
            count: purchases.length,
            purchases
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Get purchase by ID
router.get('/:id', authenticate, async (req, res) => {
    try {
        const purchase = await Purchase.findById(req.params.id)
            .populate('supplier_id')
            .populate('medicine_id');

        if (!purchase) {
            return res.status(404).json({
                status: 'error',
                message: 'Purchase not found'
            });
        }

        res.json({
            status: 'success',
            purchase
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Create purchase
router.post('/', authenticate, async (req, res) => {
    try {
        const { supplier_id, medicine_id, quantity, buying_price, purchase_date, invoice_number, notes } = req.body;

        if (!supplier_id || !medicine_id || !quantity || !buying_price) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide all required fields'
            });
        }

        const purchase = new Purchase({
            supplier_id,
            medicine_id,
            quantity: parseInt(quantity),
            buying_price: parseFloat(buying_price),
            purchase_date: purchase_date || Date.now(),
            invoice_number,
            notes
        });

        await purchase.save();

        // Update medicine stock
        await Medicine.findByIdAndUpdate(
            medicine_id,
            { $inc: { quantity: parseInt(quantity) } }
        );

        await purchase.populate('supplier_id').populate('medicine_id');

        res.status(201).json({
            status: 'success',
            message: 'Purchase recorded successfully',
            purchase
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Delete purchase
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const purchase = await Purchase.findByIdAndDelete(req.params.id);

        if (!purchase) {
            return res.status(404).json({
                status: 'error',
                message: 'Purchase not found'
            });
        }

        // Reverse stock update (optional - for accurate tracking)
        // await Medicine.findByIdAndUpdate(
        //   purchase.medicine_id,
        //   { $inc: { quantity: -purchase.quantity } }
        // );

        res.json({
            status: 'success',
            message: 'Purchase deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

module.exports = router;
