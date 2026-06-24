const express = require('express');
const { authenticate } = require('../middleware/auth');
const Medicine = require('../models/Medicine');
const Purchase = require('../models/Purchase');
const Sale = require('../models/Sale');
const Supplier = require('../models/Supplier');
const Alert = require('../models/Alert');

const router = express.Router();

// Stock Report
router.get('/stock', authenticate, async (req, res) => {
    try {
        const medicines = await Medicine.find({}).sort({ quantity: 1 });

        const totalValue = medicines.reduce((sum, m) => sum + (m.quantity * m.unit_price), 0);
        const lowStock = medicines.filter(m => m.quantity < 10).length;
        const outOfStock = medicines.filter(m => m.quantity === 0).length;

        res.json({
            status: 'success',
            summary: {
                totalMedicines: medicines.length,
                totalValue,
                lowStockItems: lowStock,
                outOfStockItems: outOfStock
            },
            medicines
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Sales Report
router.get('/sales', authenticate, async (req, res) => {
    try {
        const { from, to } = req.query;
        let query = {};

        if (from || to) {
            query.sale_date = {};
            if (from) query.sale_date.$gte = new Date(from);
            if (to) query.sale_date.$lte = new Date(to);
        }

        const sales = await Sale.find(query)
            .populate('medicine_id')
            .populate('created_by', 'full_name')
            .sort({ sale_date: -1 });

        const totalRevenue = sales.reduce((sum, s) => sum + s.total_amount, 0);
        const totalQty = sales.reduce((sum, s) => sum + s.quantity, 0);

        res.json({
            status: 'success',
            summary: {
                transactions: sales.length,
                totalRevenue,
                totalQty
            },
            sales
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Expiry Report
router.get('/expiry', authenticate, async (req, res) => {
    try {
        const medicines = await Medicine.find({});
        const today = new Date();

        const expired = medicines.filter(m => new Date(m.expiry_date) < today);
        const expiringSoon = medicines.filter(m => {
            const days = Math.ceil((new Date(m.expiry_date) - today) / (1000 * 60 * 60 * 24));
            return days > 0 && days <= 30;
        });
        const valid = medicines.filter(m => {
            const days = Math.ceil((new Date(m.expiry_date) - today) / (1000 * 60 * 60 * 24));
            return days > 30;
        });

        res.json({
            status: 'success',
            summary: {
                expired: expired.length,
                expiringSoon: expiringSoon.length,
                valid: valid.length
            },
            data: {
                expired,
                expiringSoon,
                valid
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Supplier Report
router.get('/suppliers', authenticate, async (req, res) => {
    try {
        const suppliers = await Supplier.find({ is_active: true });
        const purchases = await Purchase.find({}).populate('supplier_id');

        const supplierStats = suppliers.map(supplier => {
            const supplierPurchases = purchases.filter(p => p.supplier_id._id.toString() === supplier._id.toString());
            const totalQty = supplierPurchases.reduce((sum, p) => sum + p.quantity, 0);
            const totalSpent = supplierPurchases.reduce((sum, p) => sum + p.total_cost, 0);

            return {
                ...supplier.toObject(),
                purchaseCount: supplierPurchases.length,
                totalQty,
                totalSpent
            };
        }).sort((a, b) => b.totalSpent - a.totalSpent);

        const totalSpent = supplierStats.reduce((sum, s) => sum + s.totalSpent, 0);

        res.json({
            status: 'success',
            summary: {
                totalSuppliers: suppliers.length,
                totalPurchases: purchases.length,
                totalSpent
            },
            suppliers: supplierStats
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Dashboard Stats
router.get('/dashboard/stats', authenticate, async (req, res) => {
    try {
        const medicines = await Medicine.find({});
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todaySales = await Sale.find({
            sale_date: { $gte: today }
        });

        const lowStock = medicines.filter(m => m.quantity < 10).length;
        const expiring = medicines.filter(m => {
            const days = Math.ceil((new Date(m.expiry_date) - today) / (1000 * 60 * 60 * 24));
            return days >= 0 && days <= 30;
        }).length;

        const todayRevenue = todaySales.reduce((sum, s) => sum + s.total_amount, 0);

        res.json({
            status: 'success',
            stats: {
                totalMedicines: medicines.length,
                lowStockItems: lowStock,
                expiringItems: expiring,
                todayTransactions: todaySales.length,
                todayRevenue
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

module.exports = router;
