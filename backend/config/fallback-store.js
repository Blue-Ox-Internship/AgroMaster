const demoUsers = require('./demo-users');

const today = new Date();
const dp = (months) => {
    const dd = new Date(today);
    dd.setMonth(dd.getMonth() - months);
    return dd.toISOString().split('T')[0];
};
const pd = (days) => {
    const dd = new Date(today);
    dd.setDate(dd.getDate() - days);
    return dd.toISOString().split('T')[0];
};

const state = {
    users: demoUsers.map((user) => ({ ...user, user_id: user.user_id || `usr_${Math.random().toString(36).slice(2, 7)}` })),
    medicines: [
        { medicine_id: 'med_001', medicine_name: 'Oxytetracycline 20%', category: 'Antibiotic', manufacturer: 'Norbrook', batch_number: 'BAT001', expiry_date: '2027-03-15', quantity: 120, unit_price: 18000, description: 'Broad-spectrum antibiotic for livestock', created_at: dp(3) },
        { medicine_id: 'med_002', medicine_name: 'Albendazole Bolus', category: 'Dewormer', manufacturer: 'Elanco', batch_number: 'BAT002', expiry_date: '2027-01-10', quantity: 80, unit_price: 12000, description: 'Dewormer for internal parasites', created_at: dp(3) },
        { medicine_id: 'med_003', medicine_name: 'Ivermectin Injection', category: 'Dewormer', manufacturer: 'Kepro', batch_number: 'BAT003', expiry_date: '2026-11-05', quantity: 45, unit_price: 25000, description: 'Treats internal and external parasites', created_at: dp(2) },
        { medicine_id: 'med_004', medicine_name: 'Penicillin-Streptomycin', category: 'Antibiotic', manufacturer: 'Norbrook', batch_number: 'BAT004', expiry_date: '2027-08-20', quantity: 150, unit_price: 22000, description: '', created_at: dp(2) },
        { medicine_id: 'med_005', medicine_name: 'Multivitamin Injection', category: 'Vitamin', manufacturer: 'Intervet', batch_number: 'BAT005', expiry_date: '2026-12-30', quantity: 60, unit_price: 15000, description: '', created_at: dp(2) },
        { medicine_id: 'med_006', medicine_name: 'Calcium Borogluconate', category: 'Supplement', manufacturer: 'Elanco', batch_number: 'BAT006', expiry_date: '2028-02-12', quantity: 95, unit_price: 28000, description: '', created_at: dp(1) },
        { medicine_id: 'med_007', medicine_name: 'Ketoprofen Injection', category: 'Anti-inflammatory', manufacturer: 'Kepro', batch_number: 'BAT007', expiry_date: '2026-09-18', quantity: 18, unit_price: 35000, description: '', created_at: dp(4) },
        { medicine_id: 'med_008', medicine_name: 'Diminazene Aceturate', category: 'Antiprotozoal', manufacturer: 'Intervet', batch_number: 'BAT008', expiry_date: '2027-05-22', quantity: 75, unit_price: 30000, description: '', created_at: dp(1) },
        { medicine_id: 'med_009', medicine_name: 'Amprolium Powder', category: 'Coccidiostat', manufacturer: 'Norbrook', batch_number: 'BAT009', expiry_date: '2027-04-11', quantity: 55, unit_price: 27000, description: '', created_at: dp(1) },
        { medicine_id: 'med_010', medicine_name: 'Sulfadimidine Injection', category: 'Antibiotic', manufacturer: 'Elanco', batch_number: 'BAT010', expiry_date: '2026-10-08', quantity: 20, unit_price: 24000, description: '', created_at: dp(1) }
    ],
    suppliers: [
        { supplier_id: 'sup_001', supplier_name: 'Norbrook Uganda Ltd', phone: '+256 414 123456', email: 'orders@norbrook.ug', address: 'Plot 45, Kampala Industrial Area', is_active: true, created_at: '2024-01-05T00:00:00.000Z' },
        { supplier_id: 'sup_002', supplier_name: 'Elanco Animal Health', phone: '+256 414 234567', email: 'ugorders@elanco.com', address: 'Nakawa Business Park, Kampala', is_active: true, created_at: '2024-01-06T00:00:00.000Z' },
        { supplier_id: 'sup_003', supplier_name: 'Kepro B.V. East Africa', phone: '+256 414 345678', email: 'sales@kepro.ug', address: 'Portbell Road, Kampala', is_active: true, created_at: '2024-01-07T00:00:00.000Z' }
    ],
    purchases: [
        { purchase_id: 'pur_001', supplier_id: 'sup_001', medicine_id: 'med_001', quantity: 50, buying_price: 15000, purchase_date: dp(3) },
        { purchase_id: 'pur_002', supplier_id: 'sup_002', medicine_id: 'med_002', quantity: 30, buying_price: 10000, purchase_date: dp(3) },
        { purchase_id: 'pur_003', supplier_id: 'sup_003', medicine_id: 'med_003', quantity: 40, buying_price: 20000, purchase_date: dp(2) }
    ],
    sales: [
        { sale_id: 'sal_001', medicine_id: 'med_001', quantity: 3, selling_price: 35000, total_amount: 105000, sale_date: pd(0) },
        { sale_id: 'sal_002', medicine_id: 'med_005', quantity: 10, selling_price: 22000, total_amount: 220000, sale_date: pd(0) },
        { sale_id: 'sal_003', medicine_id: 'med_003', quantity: 2, selling_price: 42000, total_amount: 84000, sale_date: pd(1) },
        { sale_id: 'sal_004', medicine_id: 'med_009', quantity: 4, selling_price: 38000, total_amount: 152000, sale_date: pd(2) },
        { sale_id: 'sal_005', medicine_id: 'med_006', quantity: 1, selling_price: 65000, total_amount: 65000, sale_date: pd(3) }
    ],
    alerts: [
        { alert_id: 'alt_001', medicine_id: 'med_007', alert_type: 'low_stock', message: 'Low Stock Alert: Ketoprofen Injection quantity (18) is below threshold 10.', status: 'unread', created_at: new Date().toISOString() },
        { alert_id: 'alt_002', medicine_id: 'med_010', alert_type: 'expiry', message: 'Expiry Warning: Sulfadimidine Injection expires soon on 2026-10-08.', status: 'unread', created_at: new Date().toISOString() }
    ]
};

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function getCollectionNameField(collectionName) {
    switch (collectionName) {
        case 'users': return 'user_id';
        case 'medicines': return 'medicine_id';
        case 'suppliers': return 'supplier_id';
        case 'purchases': return 'purchase_id';
        case 'sales': return 'sale_id';
        case 'alerts': return 'alert_id';
        default: return 'id';
    }
}

function createId(prefix) {
    return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

function getCollection(collectionName) {
    return clone(state[collectionName] || []);
}

function getItem(collectionName, id) {
    const collection = state[collectionName] || [];
    const field = getCollectionNameField(collectionName);
    return clone(collection.find((item) => String(item[field]) === String(id)) || null);
}

function listItems(collectionName, filters = {}) {
    let collection = getCollection(collectionName);

    if (filters.category) {
        collection = collection.filter((item) => item.category === filters.category);
    }

    if (filters.search) {
        const search = String(filters.search).toLowerCase();
        collection = collection.filter((item) => {
            const haystack = `${item.medicine_name || ''} ${item.manufacturer || ''} ${item.supplier_name || ''} ${item.email || ''}`.toLowerCase();
            return haystack.includes(search);
        });
    }

    if (filters.is_active !== undefined) {
        collection = collection.filter((item) => item.is_active === filters.is_active);
    }

    if (filters.status) {
        collection = collection.filter((item) => item.status === filters.status);
    }

    if (filters.alert_type) {
        collection = collection.filter((item) => item.alert_type === filters.alert_type);
    }

    if (filters.supplier_id) {
        collection = collection.filter((item) => String(item.supplier_id) === String(filters.supplier_id));
    }

    if (filters.medicine_id) {
        collection = collection.filter((item) => String(item.medicine_id) === String(filters.medicine_id));
    }

    if (filters.from || filters.to) {
        const from = filters.from ? new Date(filters.from) : null;
        const to = filters.to ? new Date(filters.to) : null;
        collection = collection.filter((item) => {
            const value = new Date(item.purchase_date || item.sale_date || item.created_at || 0);
            return (!from || value >= from) && (!to || value <= to);
        });
    }

    if (filters.limit) {
        collection = collection.slice(0, Number(filters.limit));
    }

    return collection.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

function createItem(collectionName, payload) {
    const collection = state[collectionName] || [];
    const field = getCollectionNameField(collectionName);
    const item = { ...payload };
    item[field] = item[field] || createId(collectionName === 'users' ? 'usr' : collectionName === 'medicines' ? 'med' : collectionName === 'suppliers' ? 'sup' : collectionName === 'purchases' ? 'pur' : collectionName === 'sales' ? 'sal' : 'alt');
    item.created_at = item.created_at || new Date().toISOString();
    item.updated_at = item.updated_at || item.created_at;
    collection.push(item);
    state[collectionName] = collection;
    return clone(item);
}

function updateItem(collectionName, id, payload) {
    const collection = state[collectionName] || [];
    const field = getCollectionNameField(collectionName);
    const index = collection.findIndex((item) => String(item[field]) === String(id));

    if (index === -1) {
        return null;
    }

    const updatedItem = { ...collection[index], ...payload, updated_at: new Date().toISOString() };
    collection[index] = updatedItem;
    state[collectionName] = collection;
    return clone(updatedItem);
}

function deleteItem(collectionName, id) {
    const collection = state[collectionName] || [];
    const field = getCollectionNameField(collectionName);
    const nextCollection = collection.filter((item) => String(item[field]) !== String(id));
    state[collectionName] = nextCollection;
    return nextCollection.length !== collection.length;
}

module.exports = {
    getCollection,
    getItem,
    listItems,
    createItem,
    updateItem,
    deleteItem,
    state
};
