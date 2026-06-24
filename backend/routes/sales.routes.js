const express = require('express');
const { authenticate } = require('../middleware/auth');
const Sale = require('../models/Sale');
const Medicine = require('../models/Medicine');

const router = express.Router();

// Get all sales
router.get('/', authenticate, async (req, res) => {
    try {
        const { medicine_id, from, to, payment_method } = req.query;
        let query = {};

        if (medicine_id) query.medicine_id = medicine_id;
        if (payment_method) query.payment_method = payment_method;

        if (from || to) {
            query.sale_date = {};
            if (from) query.sale_date.$gte = new Date(from);
            if (to) query.sale_date.$lte = new Date(to);
        }

        const sales = await Sale.find(query)
            .populate('medicine_id')
            .populate('created_by', 'full_name')
            .sort({ sale_date: -1 });

        res.json({
            status: 'success',
            count: sales.length,
            sales
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Get sales statistics
router.get('/stats/daily', authenticate, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todaySales = await Sale.find({
            sale_date: { $gte: today, $lt: tomorrow }
        });

        const totalToday = todaySales.reduce((sum, s) => sum + s.total_amount, 0);

        res.json({
            status: 'success',
            stats: {
                todayTransactions: todaySales.length,
                todayRevenue: totalToday
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Get sale by ID
router.get('/:id', authenticate, async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id)
            .populate('medicine_id')
            .populate('created_by', 'full_name');

        if (!sale) {
            return res.status(404).json({
                status: 'error',
                message: 'Sale not found'
            });
        }

        res.json({
            status: 'success',
            sale
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Create sale
router.post('/', authenticate, async (req, res) => {
    try {
        const { medicine_id, quantity, selling_price, sale_date, customer_name, payment_method, notes } = req.body;

        if (!medicine_id || !quantity || !selling_price) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide all required fields'
            });
        }

        // Check medicine stock
        const medicine = await Medicine.findById(medicine_id);
        if (!medicine) {
            return res.status(404).json({
                status: 'error',
                message: 'Medicine not found'
            });
        }

        if (medicine.quantity < quantity) {
            return res.status(400).json({
                status: 'error',
                message: `Insufficient stock. Only ${medicine.quantity} units available`
            });
        }

        const sale = new Sale({
            medicine_id,
            quantity: parseInt(quantity),
            selling_price: parseFloat(selling_price),
            sale_date: sale_date || Date.now(),
            customer_name,
            payment_method: payment_method || 'Cash',
            notes,
            created_by: req.user.user_id
        });

        await sale.save();

        // Deduct from stock
        await Medicine.findByIdAndUpdate(
            medicine_id,
            { $inc: { quantity: -parseInt(quantity) } }
        );

        await sale.populate('medicine_id').populate('created_by', 'full_name');

        res.status(201).json({
            status: 'success',
            message: 'Sale recorded successfully',
            sale
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Delete sale
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const sale = await Sale.findByIdAndDelete(req.params.id);

        if (!sale) {
            return res.status(404).json({
                status: 'error',
                message: 'Sale not found'
            });
        }

        // Restore stock (optional)
        // await Medicine.findByIdAndUpdate(
        //   sale.medicine_id,
        //   { $inc: { quantity: sale.quantity } }
        // );

        res.json({
            status: 'success',
            message: 'Sale deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

module.exports = router;
