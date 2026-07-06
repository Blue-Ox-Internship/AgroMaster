const express = require('express');
const { authenticate } = require('../middleware/auth');
const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
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

// Get all suppliers
router.get('/', authenticate, async (req, res) => {
    try {
        if (supabaseConfigured) {
            const { search } = req.query;
            const { data, error } = await supabaseClient.from('suppliers').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            let suppliers = data || [];
            suppliers = suppliers.filter((supplier) => supplier.is_active !== false);
            if (search) {
                const term = String(search).toLowerCase();
                suppliers = suppliers.filter((supplier) => [supplier.supplier_name, supplier.phone, supplier.email, supplier.contact_person].some((value) => String(value || '').toLowerCase().includes(term)));
            }
            return res.json({ status: 'success', count: suppliers.length, suppliers });
        }

        if (!req.app.locals.dbConnected) {
            const suppliers = fallbackStore.listItems('suppliers', { ...req.query, is_active: true });
            return res.json({ status: 'success', count: suppliers.length, suppliers });
        }

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
        if (supabaseConfigured) {
            const { data: supplier, error: supplierError } = await supabaseClient.from('suppliers').select('*').eq('id', req.params.id).maybeSingle();
            if (supplierError) throw supplierError;
            if (!supplier) {
                return res.status(404).json({ status: 'error', message: 'Supplier not found' });
            }

            const { data: purchases = [] } = await supabaseClient.from('purchases').select('*').eq('supplier_id', req.params.id);
            const totalQty = purchases.reduce((sum, p) => sum + Number(p.quantity || 0), 0);
            const totalSpent = purchases.reduce((sum, p) => sum + Number(p.total_cost || 0), 0);

            return res.json({
                status: 'success',
                supplier,
                stats: {
                    purchaseCount: purchases.length,
                    totalQty,
                    totalSpent
                }
            });
        }

        const supplier = await Supplier.findById(req.params.id);

        if (!supplier) {
            return res.status(404).json({
                status: 'error',
                message: 'Supplier not found'
            });
        }

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

        if (supabaseConfigured) {
            const { data, error } = await supabaseClient.from('suppliers').insert({
                supplier_name,
                phone,
                email,
                address,
                contact_person,
                payment_terms: payment_terms || 'Net 30',
                is_active: true
            }).select('*').single();

            if (error) throw error;
            return res.status(201).json({ status: 'success', message: 'Supplier added successfully', supplier: data });
        }

        if (!req.app.locals.dbConnected) {
            const supplier = fallbackStore.createItem('suppliers', {
                supplier_name,
                phone,
                email,
                address,
                contact_person,
                payment_terms,
                is_active: true
            });
            return res.status(201).json({ status: 'success', message: 'Supplier added successfully', supplier });
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
        if (supabaseConfigured) {
            const { data, error } = await supabaseClient.from('suppliers').update({
                ...req.body,
                updated_at: new Date().toISOString()
            }).eq('id', req.params.id).select('*').single();

            if (error) throw error;
            return res.json({ status: 'success', message: 'Supplier updated successfully', supplier: data });
        }

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
        if (supabaseConfigured) {
            const { data, error } = await supabaseClient.from('suppliers').update({ is_active: false, updated_at: new Date().toISOString() }).eq('id', req.params.id).select('*').single();
            if (error) throw error;
            return res.json({ status: 'success', message: 'Supplier deleted successfully', supplier: data });
        }

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
