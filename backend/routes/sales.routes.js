const express = require('express');
const { authenticate } = require('../middleware/auth');
const { saleRules, idParamRule } = require('../middleware/validate');
const Sale = require('../models/Sale');
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

async function enrichSale(sale) {
    if (!sale) return sale;
    const [medicineResponse, userResponse] = await Promise.all([
        supabaseClient.from('medicines').select('*').eq('id', sale.medicine_id).maybeSingle(),
        supabaseClient.from('users').select('id, full_name').eq('id', sale.created_by).maybeSingle()
    ]);

    return {
        ...sale,
        medicine_id: medicineResponse.data || null,
        created_by: userResponse.data || null
    };
}

// Get all sales
router.get('/', authenticate, async (req, res) => {
    try {
        if (supabaseConfigured) {
            const { medicine_id, from, to, payment_method } = req.query;
            let query = supabaseClient.from('sales').select('*').order('sale_date', { ascending: false });
            if (medicine_id) query = query.eq('medicine_id', medicine_id);
            if (payment_method) query = query.eq('payment_method', payment_method);
            if (from) query = query.gte('sale_date', from);
            if (to) query = query.lte('sale_date', to);

            const { data, error } = await query;
            if (error) throw error;
            const sales = await Promise.all((data || []).map(enrichSale));
            return res.json({ status: 'success', count: sales.length, sales });
        }

        if (!req.app.locals.dbConnected) {
            const sales = fallbackStore.listItems('sales', req.query);
            return res.json({ status: 'success', count: sales.length, sales });
        }

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
        if (supabaseConfigured) {
            const today = new Date().toISOString().split('T')[0];
            const { data, error } = await supabaseClient.from('sales').select('*').gte('sale_date', today);
            if (error) throw error;
            const totalToday = (data || []).reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
            return res.json({ status: 'success', stats: { todayTransactions: (data || []).length, todayRevenue: totalToday } });
        }

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
router.get('/:id', authenticate, idParamRule, async (req, res) => {
    try {
        if (supabaseConfigured) {
            const { data, error } = await supabaseClient.from('sales').select('*').eq('id', req.params.id).maybeSingle();
            if (error) throw error;
            if (!data) {
                return res.status(404).json({ status: 'error', message: 'Sale not found' });
            }
            const sale = await enrichSale(data);
            return res.json({ status: 'success', sale });
        }

        if (!req.app.locals.dbConnected) {
            const sale = fallbackStore.getItem('sales', req.params.id);
            if (!sale) {
                return res.status(404).json({ status: 'error', message: 'Sale not found' });
            }
            return res.json({ status: 'success', sale });
        }

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
router.post('/', authenticate, saleRules, async (req, res) => {
    try {
        const { medicine_id, quantity, selling_price, sale_date, customer_name, payment_method, notes } = req.body;

        if (!medicine_id || !quantity || !selling_price) {
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
            if (Number(medicineData.quantity || 0) < Number(quantity)) {
                return res.status(400).json({ status: 'error', message: `Insufficient stock. Only ${medicineData.quantity} units available` });
            }

            const { data, error } = await supabaseClient.from('sales').insert({
                medicine_id,
                quantity: Number(quantity),
                selling_price: Number(selling_price),
                total_amount: Number(quantity) * Number(selling_price),
                sale_date: sale_date || new Date().toISOString().split('T')[0],
                customer_name,
                payment_method: payment_method || 'Cash',
                notes,
                created_by: req.user?.user_id || null
            }).select('*').single();

            if (error) throw error;
            await supabaseClient.from('medicines').update({ quantity: Number(medicineData.quantity || 0) - Number(quantity), updated_at: new Date().toISOString() }).eq('id', medicine_id);
            const sale = await enrichSale(data);
            return res.status(201).json({ status: 'success', message: 'Sale recorded successfully', sale });
        }

        if (!req.app.locals.dbConnected) {
            const medicine = fallbackStore.getItem('medicines', medicine_id);
            if (!medicine) {
                return res.status(404).json({ status: 'error', message: 'Medicine not found' });
            }

            if (Number(medicine.quantity || 0) < Number(quantity)) {
                return res.status(400).json({ status: 'error', message: `Insufficient stock. Only ${medicine.quantity} units available` });
            }

            fallbackStore.updateItem('medicines', medicine_id, { quantity: Number(medicine.quantity || 0) - Number(quantity) });
            const sale = fallbackStore.createItem('sales', {
                medicine_id,
                quantity: Number(quantity),
                selling_price: Number(selling_price),
                total_amount: Number(quantity) * Number(selling_price),
                sale_date: sale_date || new Date().toISOString().split('T')[0],
                customer_name,
                payment_method: payment_method || 'Cash',
                notes,
                created_by: req.user?.user_id || 'demo-user'
            });
            return res.status(201).json({ status: 'success', message: 'Sale recorded successfully', sale });
        }

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
router.delete('/:id', authenticate, idParamRule, async (req, res) => {
    try {
        if (supabaseConfigured) {
            const { error } = await supabaseClient.from('sales').delete().eq('id', req.params.id);
            if (error) throw error;
            return res.json({ status: 'success', message: 'Sale deleted successfully' });
        }

        if (!req.app.locals.dbConnected) {
            const deleted = fallbackStore.deleteItem('sales', req.params.id);
            return res.json({ status: 'success', message: deleted ? 'Sale deleted successfully' : 'Sale not found' });
        }

        const sale = await Sale.findByIdAndDelete(req.params.id);

        if (!sale) {
            return res.status(404).json({
                status: 'error',
                message: 'Sale not found'
            });
        }

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
