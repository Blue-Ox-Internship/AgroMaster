const express = require('express');
const { authenticate } = require('../middleware/auth');
const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');

const router = express.Router();

// Get all suppliers
router.get('/', authenticate, async (req, res) => {
    try {
        const { search } = req.query;
        let query = { is_active: true };

        if (search) {
            query.$or = [
                { supplier_name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const suppliers = await Supplier.find(query).sort({ created_at: -1 });

        res.json({
            status: 'success',
            count: suppliers.length,
            suppliers
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Get supplier by ID
router.get('/:id', authenticate, async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);

        if (!supplier) {
            return res.status(404).json({
                status: 'error',
                message: 'Supplier not found'
            });
        }

        // Get purchase statistics
        const purchases = await Purchase.find({ supplier_id: req.params.id });
        const totalQty = purchases.reduce((sum, p) => sum + p.quantity, 0);
        const totalSpent = purchases.reduce((sum, p) => sum + p.total_cost, 0);

        res.json({
            status: 'success',
            supplier,
            stats: {
                purchaseCount: purchases.length,
                totalQty,
                totalSpent
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Create supplier
router.post('/', authenticate, async (req, res) => {
    try {
        const { supplier_name, phone, email, address, contact_person, payment_terms } = req.body;

        if (!supplier_name || !phone) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide supplier name and phone'
            });
        }

        const supplier = new Supplier({
            supplier_name,
            phone,
            email,
            address,
            contact_person,
            payment_terms
        });

        await supplier.save();

        res.status(201).json({
            status: 'success',
            message: 'Supplier added successfully',
            supplier
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Update supplier
router.put('/:id', authenticate, async (req, res) => {
    try {
        const supplier = await Supplier.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updated_at: Date.now() },
            { new: true, runValidators: true }
        );

        if (!supplier) {
            return res.status(404).json({
                status: 'error',
                message: 'Supplier not found'
            });
        }

        res.json({
            status: 'success',
            message: 'Supplier updated successfully',
            supplier
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Delete supplier (soft delete)
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const supplier = await Supplier.findByIdAndUpdate(
            req.params.id,
            { is_active: false },
            { new: true }
        );

        if (!supplier) {
            return res.status(404).json({
                status: 'error',
                message: 'Supplier not found'
            });
        }

        res.json({
            status: 'success',
            message: 'Supplier deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

module.exports = router;
