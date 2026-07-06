const demoUsers = require('./demo-users');

const state = {
    users: demoUsers.map((user) => ({ ...user, user_id: user.user_id || `usr_${Math.random().toString(36).slice(2, 7)}` })),
    medicines: [
        {
            medicine_id: 'med_001',
            medicine_name: 'Oxytetracycline 20%',
            category: 'Antibiotic',
            manufacturer: 'Norbrook',
            batch_number: 'BT2024001',
            expiry_date: '2026-12-31',
            quantity: 45,
            unit_price: 35000,
            description: 'Broad-spectrum antibiotic for livestock',
            created_at: '2024-01-10T08:00:00.000Z',
            updated_at: '2024-01-10T08:00:00.000Z'
        },
        {
            medicine_id: 'med_002',
            medicine_name: 'Albendazole 2.5%',
            category: 'Antiparasitic',
            manufacturer: 'Elanco',
            batch_number: 'BT2024002',
            expiry_date: '2026-10-15',
            quantity: 7,
            unit_price: 18000,
            description: 'Dewormer for internal parasites',
            created_at: '2024-01-12T08:00:00.000Z',
            updated_at: '2024-01-12T08:00:00.000Z'
        },
        {
            medicine_id: 'med_003',
            medicine_name: 'Ivermectin 1%',
            category: 'Antiparasitic',
            manufacturer: 'Kepro',
            batch_number: 'BT2024003',
            expiry_date: '2026-09-30',
            quantity: 30,
            unit_price: 42000,
            description: 'Treats internal and external parasites',
            created_at: '2024-01-13T08:00:00.000Z',
            updated_at: '2024-01-13T08:00:00.000Z'
        }
    ],
    suppliers: [
        {
            supplier_id: 'sup_001',
            supplier_name: 'Norbrook Uganda Ltd',
            phone: '+256 414 123456',
            email: 'orders@norbrook.ug',
            address: 'Plot 45, Kampala Industrial Area',
            contact_person: 'Jane Ayesiga',
            payment_terms: 'Net 30',
            is_active: true,
            created_at: '2024-01-05T00:00:00.000Z',
            updated_at: '2024-01-05T00:00:00.000Z'
        },
        {
            supplier_id: 'sup_002',
            supplier_name: 'Elanco Animal Health',
            phone: '+256 414 234567',
            email: 'ugorders@elanco.com',
            address: 'Nakawa Business Park, Kampala',
            contact_person: 'Moses Otim',
            payment_terms: 'Net 15',
            is_active: true,
            created_at: '2024-01-06T00:00:00.000Z',
            updated_at: '2024-01-06T00:00:00.000Z'
        }
    ],
    purchases: [],
    sales: [],
    alerts: []
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
