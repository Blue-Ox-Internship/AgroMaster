const express = require('express');
const { authenticate } = require('../middleware/auth');
const Medicine = require('../models/Medicine');
const Alert = require('../models/Alert');

const router = express.Router();

// Get all medicines
router.get('/', authenticate, async (req, res) => {
    try {
        const { category, search } = req.query;
        let query = {};

        if (category) query.category = category;
        if (search) {
            query.$or = [
                { medicine_name: { $regex: search, $options: 'i' } },
                { manufacturer: { $regex: search, $options: 'i' } }
            ];
        }

        const medicines = await Medicine.find(query).sort({ created_at: -1 });

        res.json({
            status: 'success',
            count: medicines.length,
            medicines
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Get medicine by ID
router.get('/:id', authenticate, async (req, res) => {
    try {
        const medicine = await Medicine.findById(req.params.id);

        if (!medicine) {
            return res.status(404).json({
                status: 'error',
                message: 'Medicine not found'
            });
        }

        res.json({
            status: 'success',
            medicine
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Create medicine
router.post('/', authenticate, async (req, res) => {
    try {
        const { medicine_name, category, manufacturer, batch_number, expiry_date, quantity, unit_price, description } = req.body;

        if (!medicine_name || !category || !expiry_date || quantity === undefined || !unit_price) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide all required fields'
            });
        }

        const medicine = new Medicine({
            medicine_name,
            category,
            manufacturer,
            batch_number,
            expiry_date,
            quantity,
            unit_price,
            description
        });

        await medicine.save();

        res.status(201).json({
            status: 'success',
            message: 'Medicine added successfully',
            medicine
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Update medicine
router.put('/:id', authenticate, async (req, res) => {
    try {
        const medicine = await Medicine.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updated_at: Date.now() },
            { new: true, runValidators: true }
        );

        if (!medicine) {
            return res.status(404).json({
                status: 'error',
                message: 'Medicine not found'
            });
        }

        res.json({
            status: 'success',
            message: 'Medicine updated successfully',
            medicine
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Delete medicine
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const medicine = await Medicine.findByIdAndDelete(req.params.id);

        if (!medicine) {
            return res.status(404).json({
                status: 'error',
                message: 'Medicine not found'
            });
        }

        res.json({
            status: 'success',
            message: 'Medicine deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Check and generate alerts
router.post('/alerts/check', authenticate, async (req, res) => {
    try {
        const medicines = await Medicine.find({});

        for (const med of medicines) {
            const expiryDate = new Date(med.expiry_date);
            const today = new Date();
            const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

            // Low stock alert
            if (med.quantity < 10) {
                const existingAlert = await Alert.findOne({
                    medicine_id: med._id,
                    alert_type: 'low_stock',
                    status: 'unread'
                });

                if (!existingAlert) {
                    await Alert.create({
                        medicine_id: med._id,
                        alert_type: 'low_stock',
                        message: `Low stock: ${med.medicine_name} has only ${med.quantity} units remaining.`,
                        severity: 'warning'
                    });
                }
            }

            // Expiry alert
            if (daysUntilExpiry > 0 && daysUntilExpiry <= 30) {
                const existingAlert = await Alert.findOne({
                    medicine_id: med._id,
                    alert_type: 'expiry',
                    status: 'unread'
                });

                if (!existingAlert) {
                    await Alert.create({
                        medicine_id: med._id,
                        alert_type: 'expiry',
                        message: `Expiry warning: ${med.medicine_name} expires in ${daysUntilExpiry} day(s).`,
                        severity: 'warning'
                    });
                }
            }

            // Expired alert
            if (daysUntilExpiry < 0) {
                const existingAlert = await Alert.findOne({
                    medicine_id: med._id,
                    alert_type: 'expired',
                    status: 'unread'
                });

                if (!existingAlert) {
                    await Alert.create({
                        medicine_id: med._id,
                        alert_type: 'expired',
                        message: `EXPIRED: ${med.medicine_name} expired on ${expiryDate.toLocaleDateString()}.`,
                        severity: 'danger'
                    });
                }
            }
        }

        res.json({
            status: 'success',
            message: 'Alerts checked and generated'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

module.exports = router;
