const express = require('express');
const { authenticate } = require('../middleware/auth');
const Medicine = require('../models/Medicine');
const Alert = require('../models/Alert');
const supabaseClient = require('../supabase/client');
const fallbackStore = require('../config/fallback-store');

const router = express.Router();
const supabaseConfigured = Boolean(
    supabaseClient
    && supabaseClient.from
    && supabaseClient.supabaseUrl
    && (supabaseClient.supabaseServiceRoleKey || supabaseClient.supabaseAnonKey)
    && !String(supabaseClient.supabaseServiceRoleKey || supabaseClient.supabaseAnonKey).includes('replace_with')
);

async function getSupabaseMedicines() {
    const { data, error } = await supabaseClient.from('medicines').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
}

async function getSupabaseMedicineById(id) {
    const { data, error } = await supabaseClient.from('medicines').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
}

// Get all medicines
router.get('/', authenticate, async (req, res) => {
    try {
        if (supabaseConfigured) {
            const medicines = await getSupabaseMedicines();
            const { category, search } = req.query;
            let filtered = medicines;

            if (category) filtered = filtered.filter((item) => item.category === category);
            if (search) {
                const term = String(search).toLowerCase();
                filtered = filtered.filter((item) => [item.medicine_name, item.manufacturer, item.description].some((value) => String(value || '').toLowerCase().includes(term)));
            }

            return res.json({ status: 'success', count: filtered.length, medicines: filtered });
        }

        if (!req.app.locals.dbConnected) {
            const medicines = fallbackStore.listItems('medicines', req.query);
            return res.json({ status: 'success', count: medicines.length, medicines });
        }

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
        if (supabaseConfigured) {
            const medicine = await getSupabaseMedicineById(req.params.id);
            if (!medicine) {
                return res.status(404).json({ status: 'error', message: 'Medicine not found' });
            }
            return res.json({ status: 'success', medicine });
        }

        if (!req.app.locals.dbConnected) {
            const medicine = fallbackStore.getItem('medicines', req.params.id);
            if (!medicine) {
                return res.status(404).json({ status: 'error', message: 'Medicine not found' });
            }
            return res.json({ status: 'success', medicine });
        }

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

        if (supabaseConfigured) {
            const { data, error } = await supabaseClient.from('medicines').insert({
                medicine_name,
                category,
                manufacturer,
                batch_number,
                expiry_date,
                quantity: Number(quantity),
                unit_price: Number(unit_price),
                description
            }).select('*').single();

            if (error) throw error;
            return res.status(201).json({ status: 'success', message: 'Medicine added successfully', medicine: data });
        }

        if (!req.app.locals.dbConnected) {
            const medicine = fallbackStore.createItem('medicines', {
                medicine_name,
                category,
                manufacturer,
                batch_number,
                expiry_date,
                quantity: Number(quantity),
                unit_price: Number(unit_price),
                description
            });
            return res.status(201).json({ status: 'success', message: 'Medicine added successfully', medicine });
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
        if (supabaseConfigured) {
            const { data, error } = await supabaseClient.from('medicines').update({
                ...req.body,
                updated_at: new Date().toISOString()
            }).eq('id', req.params.id).select('*').single();

            if (error) throw error;
            return res.json({ status: 'success', message: 'Medicine updated successfully', medicine: data });
        }

        if (!req.app.locals.dbConnected) {
            const medicine = fallbackStore.updateItem('medicines', req.params.id, req.body);
            if (!medicine) {
                return res.status(404).json({ status: 'error', message: 'Medicine not found' });
            }
            return res.json({ status: 'success', message: 'Medicine updated successfully', medicine });
        }

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
        if (supabaseConfigured) {
            const { error } = await supabaseClient.from('medicines').delete().eq('id', req.params.id);
            if (error) throw error;
            return res.json({ status: 'success', message: 'Medicine deleted successfully' });
        }

        if (!req.app.locals.dbConnected) {
            const deleted = fallbackStore.deleteItem('medicines', req.params.id);
            return res.json({ status: 'success', message: deleted ? 'Medicine deleted successfully' : 'Medicine not found' });
        }

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
        if (supabaseConfigured) {
            const { data: medicines = [], error } = await supabaseClient.from('medicines').select('*');
            if (error) throw error;

            for (const med of medicines) {
                const expiryDate = new Date(med.expiry_date);
                const today = new Date();
                const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

                if (med.quantity < 10) {
                    const { data: existingAlerts } = await supabaseClient.from('alerts').select('*').eq('medicine_id', med.id).eq('alert_type', 'low_stock').eq('status', 'unread');
                    if (!existingAlerts || existingAlerts.length === 0) {
                        await supabaseClient.from('alerts').insert({
                            medicine_id: med.id,
                            alert_type: 'low_stock',
                            message: `Low stock: ${med.medicine_name} has only ${med.quantity} units remaining.`,
                            severity: 'warning'
                        });
                    }
                }

                if (daysUntilExpiry > 0 && daysUntilExpiry <= 30) {
                    const { data: existingAlerts } = await supabaseClient.from('alerts').select('*').eq('medicine_id', med.id).eq('alert_type', 'expiry').eq('status', 'unread');
                    if (!existingAlerts || existingAlerts.length === 0) {
                        await supabaseClient.from('alerts').insert({
                            medicine_id: med.id,
                            alert_type: 'expiry',
                            message: `Expiry warning: ${med.medicine_name} expires in ${daysUntilExpiry} day(s).`,
                            severity: 'warning'
                        });
                    }
                }

                if (daysUntilExpiry < 0) {
                    const { data: existingAlerts } = await supabaseClient.from('alerts').select('*').eq('medicine_id', med.id).eq('alert_type', 'expired').eq('status', 'unread');
                    if (!existingAlerts || existingAlerts.length === 0) {
                        await supabaseClient.from('alerts').insert({
                            medicine_id: med.id,
                            alert_type: 'expired',
                            message: `EXPIRED: ${med.medicine_name} expired on ${expiryDate.toLocaleDateString()}.`,
                            severity: 'danger'
                        });
                    }
                }
            }

            return res.json({ status: 'success', message: 'Alerts checked and generated' });
        }

        const medicines = await Medicine.find({});

        for (const med of medicines) {
            const expiryDate = new Date(med.expiry_date);
            const today = new Date();
            const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

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
