const express = require('express');
const { authenticate } = require('../middleware/auth');
const Purchase = require('../models/Purchase');
const Medicine = require('../models/Medicine');
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

async function enrichPurchase(purchase) {
    if (!purchase) return purchase;
    const [supplierResponse, medicineResponse] = await Promise.all([
        supabaseClient.from('suppliers').select('*').eq('id', purchase.supplier_id).maybeSingle(),
        supabaseClient.from('medicines').select('*').eq('id', purchase.medicine_id).maybeSingle()
    ]);

    return {
        ...purchase,
        supplier_id: supplierResponse.data || null,
        medicine_id: medicineResponse.data || null
    };
}

// Get all purchases
router.get('/', authenticate, async (req, res) => {
    try {
        if (supabaseConfigured) {
            const { supplier_id, medicine_id, from, to } = req.query;
            let query = supabaseClient.from('purchases').select('*').order('purchase_date', { ascending: false });

            if (supplier_id) query = query.eq('supplier_id', supplier_id);
            if (medicine_id) query = query.eq('medicine_id', medicine_id);
            if (from) query = query.gte('purchase_date', from);
            if (to) query = query.lte('purchase_date', to);

            const { data, error } = await query;
            if (error) throw error;
            const purchases = await Promise.all((data || []).map(enrichPurchase));
            return res.json({ status: 'success', count: purchases.length, purchases });
        }

        if (!req.app.locals.dbConnected) {
            const purchases = fallbackStore.listItems('purchases', req.query);
            return res.json({ status: 'success', count: purchases.length, purchases });
        }

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
        if (supabaseConfigured) {
            const { data, error } = await supabaseClient.from('purchases').select('*').eq('id', req.params.id).maybeSingle();
            if (error) throw error;
            if (!data) {
                return res.status(404).json({ status: 'error', message: 'Purchase not found' });
            }
            const purchase = await enrichPurchase(data);
            return res.json({ status: 'success', purchase });
        }

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

        if (supabaseConfigured) {
            const { data: medicineData } = await supabaseClient.from('medicines').select('*').eq('id', medicine_id).maybeSingle();
            if (!medicineData) {
                return res.status(404).json({ status: 'error', message: 'Medicine not found' });
            }

            const { data, error } = await supabaseClient.from('purchases').insert({
                supplier_id,
                medicine_id,
                quantity: Number(quantity),
                buying_price: Number(buying_price),
                total_cost: Number(quantity) * Number(buying_price),
                purchase_date: purchase_date || new Date().toISOString().split('T')[0],
                invoice_number,
                notes
            }).select('*').single();

            if (error) throw error;

            await supabaseClient.from('medicines').update({ quantity: Number(medicineData.quantity || 0) + Number(quantity), updated_at: new Date().toISOString() }).eq('id', medicine_id);
            const purchase = await enrichPurchase(data);
            return res.status(201).json({ status: 'success', message: 'Purchase recorded successfully', purchase });
        }

        if (!req.app.locals.dbConnected) {
            const purchase = fallbackStore.createItem('purchases', {
                supplier_id,
                medicine_id,
                quantity: Number(quantity),
                buying_price: Number(buying_price),
                total_cost: Number(quantity) * Number(buying_price),
                purchase_date: purchase_date || new Date().toISOString().split('T')[0],
                invoice_number,
                notes
            });

            const medicine = fallbackStore.getItem('medicines', medicine_id);
            if (medicine) {
                fallbackStore.updateItem('medicines', medicine_id, { quantity: Number(medicine.quantity || 0) + Number(quantity) });
            }

            return res.status(201).json({ status: 'success', message: 'Purchase recorded successfully', purchase });
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
        if (supabaseConfigured) {
            const { error } = await supabaseClient.from('purchases').delete().eq('id', req.params.id);
            if (error) throw error;
            return res.json({ status: 'success', message: 'Purchase deleted successfully' });
        }

        const purchase = await Purchase.findByIdAndDelete(req.params.id);

        if (!purchase) {
            return res.status(404).json({
                status: 'error',
                message: 'Purchase not found'
            });
        }

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
