/* =============================================
   AgroDrop - Data Layer (localStorage)
   ============================================= */

const DB = {
    keys: {
        users: 'agrodrop_users',
        medicines: 'agrodrop_medicines',
        suppliers: 'agrodrop_suppliers',
        purchases: 'agrodrop_purchases',
        sales: 'agrodrop_sales',
        alerts: 'agrodrop_alerts',
        initialized: 'agrodrop_initialized'
    },

    get(key) {
        try { return JSON.parse(localStorage.getItem(key)) || []; }
        catch { return []; }
    },

    set(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    // Users
    getUsers() { return this.get(this.keys.users); },
    saveUsers(data) { this.set(this.keys.users, data); },
    getUserById(id) { return this.getUsers().find(u => u.user_id === id); },
    getUserByEmail(email) { return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase()); },
    addUser(user) {
        const users = this.getUsers();
        user.user_id = App.generateId('usr');
        user.created_at = new Date().toISOString();
        users.push(user);
        this.saveUsers(users);
        return user;
    },
    updateUser(id, data) {
        const users = this.getUsers();
        const idx = users.findIndex(u => u.user_id === id);
        if (idx !== -1) { users[idx] = { ...users[idx], ...data }; this.saveUsers(users); }
    },
    deleteUser(id) {
        this.saveUsers(this.getUsers().filter(u => u.user_id !== id));
    },

    // Medicines
    getMedicines() { return this.get(this.keys.medicines); },
    saveMedicines(data) { this.set(this.keys.medicines, data); },
    getMedicineById(id) { return this.getMedicines().find(m => m.medicine_id === id); },
    addMedicine(med) {
        const meds = this.getMedicines();
        med.medicine_id = App.generateId('med');
        med.created_at = new Date().toISOString();
        meds.push(med);
        this.saveMedicines(meds);
        this.checkAndGenerateAlerts();
        return med;
    },
    updateMedicine(id, data) {
        const meds = this.getMedicines();
        const idx = meds.findIndex(m => m.medicine_id === id);
        if (idx !== -1) {
            meds[idx] = { ...meds[idx], ...data };
            this.saveMedicines(meds);
            this.checkAndGenerateAlerts();
        }
    },
    deleteMedicine(id) {
        this.saveMedicines(this.getMedicines().filter(m => m.medicine_id !== id));
    },
    updateMedicineStock(id, delta) {
        const meds = this.getMedicines();
        const idx = meds.findIndex(m => m.medicine_id === id);
        if (idx !== -1) {
            meds[idx].quantity = Math.max(0, (meds[idx].quantity || 0) + delta);
            this.saveMedicines(meds);
            this.checkAndGenerateAlerts();
        }
    },

    // Suppliers
    getSuppliers() { return this.get(this.keys.suppliers); },
    saveSuppliers(data) { this.set(this.keys.suppliers, data); },
    getSupplierById(id) { return this.getSuppliers().find(s => s.supplier_id === id); },
    addSupplier(sup) {
        const sups = this.getSuppliers();
        sup.supplier_id = App.generateId('sup');
        sup.created_at = new Date().toISOString();
        sups.push(sup);
        this.saveSuppliers(sups);
        return sup;
    },
    updateSupplier(id, data) {
        const sups = this.getSuppliers();
        const idx = sups.findIndex(s => s.supplier_id === id);
        if (idx !== -1) { sups[idx] = { ...sups[idx], ...data }; this.saveSuppliers(sups); }
    },
    deleteSupplier(id) {
        this.saveSuppliers(this.getSuppliers().filter(s => s.supplier_id !== id));
    },

    // Purchases
    getPurchases() { return this.get(this.keys.purchases); },
    savePurchases(data) { this.set(this.keys.purchases, data); },
    addPurchase(purchase) {
        const purchases = this.getPurchases();
        purchase.purchase_id = App.generateId('pur');
        purchase.purchase_date = purchase.purchase_date || App.today();
        purchases.push(purchase);
        this.savePurchases(purchases);
        // Update stock
        this.updateMedicineStock(purchase.medicine_id, parseInt(purchase.quantity));
        return purchase;
    },
    deletePurchase(id) {
        this.savePurchases(this.getPurchases().filter(p => p.purchase_id !== id));
    },

    // Sales
    getSales() { return this.get(this.keys.sales); },
    saveSales(data) { this.set(this.keys.sales, data); },
    addSale(sale) {
        const sales = this.getSales();
        sale.sale_id = App.generateId('sal');
        sale.sale_date = sale.sale_date || App.today();
        sale.total_amount = parseInt(sale.quantity) * parseFloat(sale.selling_price);
        sales.push(sale);
        this.saveSales(sales);
        // Deduct stock
        this.updateMedicineStock(sale.medicine_id, -parseInt(sale.quantity));
        return sale;
    },
    deleteSale(id) {
        this.saveSales(this.getSales().filter(s => s.sale_id !== id));
    },
    getTodaySales() {
        const today = App.today();
        return this.getSales().filter(s => s.sale_date === today);
    },
    getTodaySalesTotal() {
        return this.getTodaySales().reduce((sum, s) => sum + (s.total_amount || 0), 0);
    },

    // Alerts
    getAlerts() { return this.get(this.keys.alerts); },
    saveAlerts(data) { this.set(this.keys.alerts, data); },
    addAlert(alert) {
        const alerts = this.getAlerts();
        alert.alert_id = App.generateId('alt');
        alert.created_at = new Date().toISOString();
        alert.status = 'unread';
        alerts.unshift(alert);
        this.saveAlerts(alerts);
        return alert;
    },
    markAlertRead(id) {
        const alerts = this.getAlerts();
        const idx = alerts.findIndex(a => a.alert_id === id);
        if (idx !== -1) { alerts[idx].status = 'read'; this.saveAlerts(alerts); }
    },
    markAllAlertsRead() {
        const alerts = this.getAlerts().map(a => ({ ...a, status: 'read' }));
        this.saveAlerts(alerts);
    },

    checkAndGenerateAlerts() {
        const meds = this.getMedicines();
        const existingAlerts = this.getAlerts();

        meds.forEach(med => {
            // Low stock alert
            if (med.quantity < 10) {
                const hasAlert = existingAlerts.some(a =>
                    a.medicine_id === med.medicine_id && a.alert_type === 'low_stock' && a.status === 'unread'
                );
                if (!hasAlert) {
                    this.addAlert({
                        medicine_id: med.medicine_id,
                        alert_type: 'low_stock',
                        message: `Low stock: ${med.medicine_name} has only ${med.quantity} units remaining.`,
                    });
                }
            }

            // Expiry alert
            if (App.isExpiringSoon(med.expiry_date, 30)) {
                const days = App.daysUntilExpiry(med.expiry_date);
                const hasAlert = existingAlerts.some(a =>
                    a.medicine_id === med.medicine_id && a.alert_type === 'expiry' && a.status === 'unread'
                );
                if (!hasAlert) {
                    this.addAlert({
                        medicine_id: med.medicine_id,
                        alert_type: 'expiry',
                        message: `Expiry warning: ${med.medicine_name} expires in ${days} day(s) (${App.formatDate(med.expiry_date)}).`,
                    });
                }
            }

            // Expired alert
            if (App.isExpired(med.expiry_date)) {
                const hasAlert = existingAlerts.some(a =>
                    a.medicine_id === med.medicine_id && a.alert_type === 'expired' && a.status === 'unread'
                );
                if (!hasAlert) {
                    this.addAlert({
                        medicine_id: med.medicine_id,
                        alert_type: 'expired',
                        message: `EXPIRED: ${med.medicine_name} expired on ${App.formatDate(med.expiry_date)}.`,
                    });
                }
            }
        });
    }
};

/* ---- Seed Data ---- */
const SEED_VERSION = 'v6'; // bumped to force re-seed

function seedDatabase() {
    if (localStorage.getItem(DB.keys.initialized) === SEED_VERSION) return;
    // Clear old data to ensure fresh seed
    Object.values(DB.keys).forEach(k => localStorage.removeItem(k));

    // Users
    const users = [
        {
            user_id: 'usr_admin', full_name: 'Dr. Sarah Nakato', business_name: 'AgroDrop Uganda Ltd',
            email: 'admin@agrodrop.com', phone: '+256 700 123456', password: 'admin123',
            role: 'Administrator', created_at: '2024-01-10T08:00:00.000Z'
        },
        {
            user_id: 'usr_manager', full_name: 'John Ssebunya', business_name: 'AgroDrop Uganda Ltd',
            email: 'manager@agrodrop.com', phone: '+256 701 234567', password: 'manager123',
            role: 'Store Manager', created_at: '2024-01-12T08:00:00.000Z'
        },
        {
            user_id: 'usr_sales', full_name: 'Grace Apio', business_name: 'AgroDrop Uganda Ltd',
            email: 'sales@agrodrop.com', phone: '+256 702 345678', password: 'sales123',
            role: 'Sales Attendant', created_at: '2024-01-15T08:00:00.000Z'
        },
        {
            user_id: 'usr_004', full_name: 'Moses Kiggundu', business_name: 'Kiggundu Farm Supplies',
            email: 'moses@agrodrop.com', phone: '+256 703 456789', password: 'moses123',
            role: 'Sales Attendant', created_at: '2024-01-18T08:00:00.000Z'
        },
        {
            user_id: 'usr_005', full_name: 'Lydia Auma', business_name: 'North Uganda Agro',
            email: 'lydia@agrodrop.com', phone: '+256 704 567890', password: 'lydia123',
            role: 'Store Manager', created_at: '2024-01-20T08:00:00.000Z'
        },
        {
            user_id: 'usr_006', full_name: 'Emmanuel Okello', business_name: 'Eastern Vet Supplies',
            email: 'okello@agrodrop.com', phone: '+256 705 678901', password: 'okello123',
            role: 'Sales Attendant', created_at: '2024-01-22T08:00:00.000Z'
        },
        {
            user_id: 'usr_007', full_name: 'Patricia Namukasa', business_name: 'AgroDrop Uganda Ltd',
            email: 'patricia@agrodrop.com', phone: '+256 706 789012', password: 'patricia123',
            role: 'Store Manager', created_at: '2024-01-25T08:00:00.000Z'
        },
        {
            user_id: 'usr_008', full_name: 'Robert Tumwine', business_name: 'Western Agro Ltd',
            email: 'robert@agrodrop.com', phone: '+256 707 890123', password: 'robert123',
            role: 'Sales Attendant', created_at: '2024-01-28T08:00:00.000Z'
        },
        {
            user_id: 'usr_009', full_name: 'Diana Nabukenya', business_name: 'AgroDrop Uganda Ltd',
            email: 'diana@agrodrop.com', phone: '+256 708 901234', password: 'diana123',
            role: 'Administrator', created_at: '2024-02-01T08:00:00.000Z'
        },
        {
            user_id: 'usr_010', full_name: 'Samuel Muwanga', business_name: 'Central Farm Depot',
            email: 'samuel@agrodrop.com', phone: '+256 709 012345', password: 'samuel123',
            role: 'Sales Attendant', created_at: '2024-02-03T08:00:00.000Z'
        },
        {
            user_id: 'usr_011', full_name: 'Agnes Atim', business_name: 'Gulu Agro Supplies',
            email: 'agnes@agrodrop.com', phone: '+256 710 123456', password: 'agnes123',
            role: 'Store Manager', created_at: '2024-02-05T08:00:00.000Z'
        },
        {
            user_id: 'usr_012', full_name: 'Henry Byaruhanga', business_name: 'Mbarara Vet Centre',
            email: 'henry@agrodrop.com', phone: '+256 711 234567', password: 'henry123',
            role: 'Sales Attendant', created_at: '2024-02-08T08:00:00.000Z'
        },
        {
            user_id: 'usr_013', full_name: 'Florence Namwanje', business_name: 'AgroDrop Uganda Ltd',
            email: 'florence@agrodrop.com', phone: '+256 712 345678', password: 'florence123',
            role: 'Sales Attendant', created_at: '2024-02-10T08:00:00.000Z'
        }
    ];
    DB.saveUsers(users);

    // Suppliers
    const suppliers = [
        {
            supplier_id: 'sup_001', supplier_name: 'Norbrook Uganda Ltd', phone: '+256 414 123456',
            email: 'orders@norbrook.ug', address: 'Plot 45, Kampala Industrial Area', created_at: '2024-01-05T00:00:00.000Z'
        },
        {
            supplier_id: 'sup_002', supplier_name: 'Elanco Animal Health', phone: '+256 414 234567',
            email: 'ugorders@elanco.com', address: 'Nakawa Business Park, Kampala', created_at: '2024-01-06T00:00:00.000Z'
        },
        {
            supplier_id: 'sup_003', supplier_name: 'Kepro B.V. East Africa', phone: '+256 414 345678',
            email: 'sales@kepro.ug', address: 'Portbell Road, Kampala', created_at: '2024-01-07T00:00:00.000Z'
        },
        {
            supplier_id: 'sup_004', supplier_name: 'Intervet Uganda', phone: '+256 414 456789',
            email: 'orders@intervet.ug', address: 'Bugolobi, Kampala', created_at: '2024-01-08T00:00:00.000Z'
        },
        {
            supplier_id: 'sup_005', supplier_name: 'Akanyihayo Arthur', phone: '0768537006',
            email: 'akanyihayo.arthur@agrodrop.ug', address: 'Mbarara', created_at: '2024-02-10T00:00:00.000Z'
        },
        {
            supplier_id: 'sup_006', supplier_name: 'Hakiiri Keno', phone: '0774456723',
            email: 'hakiiri.keno@agrodrop.ug', address: 'Isingiro', created_at: '2024-02-11T00:00:00.000Z'
        },
        {
            supplier_id: 'sup_007', supplier_name: 'Miria Bakuziire', phone: '0787448999',
            email: 'miria.bakuziire@agrodrop.ug', address: 'Bukanga', created_at: '2024-02-12T00:00:00.000Z'
        },
        {
            supplier_id: 'sup_008', supplier_name: 'Timbi Zigid', phone: '0758954011',
            email: 'timbi.zigid@agrodrop.ug', address: 'Endiinzi', created_at: '2024-02-13T00:00:00.000Z'
        },
        {
            supplier_id: 'sup_009', supplier_name: 'Ruta Seith', phone: '0787878732',
            email: 'ruta.seith@agrodrop.ug', address: 'Ntungamo', created_at: '2024-02-14T00:00:00.000Z'
        },
        {
            supplier_id: 'sup_010', supplier_name: 'Peninah Bike', phone: '0787458999',
            email: 'peninah.bike@agrodrop.ug', address: 'Ruharo', created_at: '2024-02-15T00:00:00.000Z'
        },
        {
            supplier_id: 'sup_011', supplier_name: 'Isreal Mpami', phone: '0768538007',
            email: 'isreal.mpami@agrodrop.ug', address: 'Ishanyu', created_at: '2024-02-16T00:00:00.000Z'
        },
        {
            supplier_id: 'sup_012', supplier_name: 'Jackline Nyango', phone: '0768657034',
            email: 'jackline.nyango@agrodrop.ug', address: 'Kamaaya', created_at: '2024-02-17T00:00:00.000Z'
        }
    ];
    DB.saveSuppliers(suppliers);

    // Medicines
    const today = new Date();
    const d = (months) => {
        const dd = new Date(today);
        dd.setMonth(dd.getMonth() + months);
        return dd.toISOString().split('T')[0];
    };
    const dp = (months) => {
        const dd = new Date(today);
        dd.setMonth(dd.getMonth() - months);
        return dd.toISOString().split('T')[0];
    };

    const medicines = [
        { medicine_id: 'med_001', medicine_name: 'Oxytetracycline 20%', category: 'Antibiotic', manufacturer: 'Norbrook', batch_number: 'BAT001', expiry_date: '2027-03-15', quantity: 120, unit_price: 18000, description: '', created_at: dp(3) },
        { medicine_id: 'med_002', medicine_name: 'Albendazole Bolus', category: 'Dewormer', manufacturer: 'Elanco', batch_number: 'BAT002', expiry_date: '2027-01-10', quantity: 80, unit_price: 12000, description: '', created_at: dp(3) },
        { medicine_id: 'med_003', medicine_name: 'Ivermectin Injection', category: 'Dewormer', manufacturer: 'Kepro', batch_number: 'BAT003', expiry_date: '2026-11-05', quantity: 45, unit_price: 25000, description: '', created_at: dp(2) },
        { medicine_id: 'med_004', medicine_name: 'Penicillin-Streptomycin', category: 'Antibiotic', manufacturer: 'Norbrook', batch_number: 'BAT004', expiry_date: '2027-08-20', quantity: 150, unit_price: 22000, description: '', created_at: dp(2) },
        { medicine_id: 'med_005', medicine_name: 'Multivitamin Injection', category: 'Vitamin', manufacturer: 'Intervet', batch_number: 'BAT005', expiry_date: '2026-12-30', quantity: 60, unit_price: 15000, description: '', created_at: dp(2) },
        { medicine_id: 'med_006', medicine_name: 'Calcium Borogluconate', category: 'Supplement', manufacturer: 'Elanco', batch_number: 'BAT006', expiry_date: '2028-02-12', quantity: 95, unit_price: 28000, description: '', created_at: dp(1) },
        { medicine_id: 'med_007', medicine_name: 'Ketoprofen Injection', category: 'Anti-inflammatory', manufacturer: 'Kepro', batch_number: 'BAT007', expiry_date: '2026-09-18', quantity: 18, unit_price: 35000, description: '', created_at: dp(4) },
        { medicine_id: 'med_008', medicine_name: 'Diminazene Aceturate', category: 'Antiprotozoal', manufacturer: 'Intervet', batch_number: 'BAT008', expiry_date: '2027-05-22', quantity: 75, unit_price: 30000, description: '', created_at: dp(1) },
        { medicine_id: 'med_009', medicine_name: 'Amprolium Powder', category: 'Coccidiostat', manufacturer: 'Norbrook', batch_number: 'BAT009', expiry_date: '2027-04-11', quantity: 55, unit_price: 27000, description: '', created_at: dp(1) },
        { medicine_id: 'med_010', medicine_name: 'Sulfadimidine Injection', category: 'Antibiotic', manufacturer: 'Elanco', batch_number: 'BAT010', expiry_date: '2026-10-08', quantity: 20, unit_price: 24000, description: '', created_at: dp(1) },
        { medicine_id: 'med_011', medicine_name: 'Tylosin Injection', category: 'Antibiotic', manufacturer: 'Elanco', batch_number: 'BAT011', expiry_date: '2027-06-15', quantity: 100, unit_price: 32000, description: '', created_at: dp(1) },
        { medicine_id: 'med_012', medicine_name: 'Levamisole Injection', category: 'Dewormer', manufacturer: 'Bayer', batch_number: 'BAT012', expiry_date: '2027-07-19', quantity: 70, unit_price: 19000, description: '', created_at: dp(2) },
        { medicine_id: 'med_013', medicine_name: 'Vitamin ADE', category: 'Vitamin', manufacturer: 'Norbrook', batch_number: 'BAT013', expiry_date: '2028-01-05', quantity: 90, unit_price: 17000, description: '', created_at: dp(2) },
        { medicine_id: 'med_014', medicine_name: 'Enrofloxacin 10%', category: 'Antibiotic', manufacturer: 'Intervet', batch_number: 'BAT014', expiry_date: '2026-08-30', quantity: 12, unit_price: 45000, description: '', created_at: dp(1) },
        { medicine_id: 'med_015', medicine_name: 'Gentamycin Injection', category: 'Antibiotic', manufacturer: 'Norbrook', batch_number: 'BAT015', expiry_date: '2027-02-14', quantity: 85, unit_price: 26000, description: '', created_at: dp(2) },
        { medicine_id: 'med_016', medicine_name: 'Doxycycline Powder', category: 'Antibiotic', manufacturer: 'Kepro', batch_number: 'BAT016', expiry_date: '2026-07-28', quantity: 0, unit_price: 40000, description: '', created_at: dp(2) },
        { medicine_id: 'med_017', medicine_name: 'Flunixin Meglumine', category: 'Pain Reliever', manufacturer: 'Bayer', batch_number: 'BAT017', expiry_date: '2027-09-03', quantity: 30, unit_price: 48000, description: '', created_at: dp(3) },
        { medicine_id: 'med_018', medicine_name: 'Oxytocin Injection', category: 'Hormone', manufacturer: 'Elanco', batch_number: 'BAT018', expiry_date: '2026-10-15', quantity: 50, unit_price: 12000, description: '', created_at: dp(1) },
        { medicine_id: 'med_019', medicine_name: 'Iron Dextran', category: 'Supplement', manufacturer: 'Kepro', batch_number: 'BAT019', expiry_date: '2028-03-20', quantity: 65, unit_price: 23000, description: '', created_at: dp(1) },
        { medicine_id: 'med_020', medicine_name: 'Ciprofloxacin Tablets', category: 'Antibiotic', manufacturer: 'Norbrook', batch_number: 'BAT020', expiry_date: '2026-11-22', quantity: 25, unit_price: 21000, description: '', created_at: dp(2) },
        { medicine_id: 'med_021', medicine_name: 'Toltrazuril Oral', category: 'Coccidiostat', manufacturer: 'Intervet', batch_number: 'BAT021', expiry_date: '2027-04-30', quantity: 40, unit_price: 38000, description: '', created_at: dp(1) },
        { medicine_id: 'med_022', medicine_name: 'Closantel Oral', category: 'Dewormer', manufacturer: 'Intervet', batch_number: 'BAT022', expiry_date: '2027-12-10', quantity: 95, unit_price: 34000, description: '', created_at: dp(2) },
        { medicine_id: 'med_023', medicine_name: 'Meloxicam Injection', category: 'Anti-inflammatory', manufacturer: 'Bayer', batch_number: 'BAT023', expiry_date: '2026-09-25', quantity: 28, unit_price: 37000, description: '', created_at: dp(1) },
        { medicine_id: 'med_024', medicine_name: 'Neomycin Powder', category: 'Antibiotic', manufacturer: 'Kepro', batch_number: 'BAT024', expiry_date: '2026-08-14', quantity: 0, unit_price: 29000, description: '', created_at: dp(2) },
        { medicine_id: 'med_025', medicine_name: 'Electrolyte Powder', category: 'Supplement', manufacturer: 'Elanco', batch_number: 'BAT025', expiry_date: '2028-04-01', quantity: 110, unit_price: 14000, description: '', created_at: dp(1) },
        { medicine_id: 'med_026', medicine_name: 'Selenium + Vitamin E', category: 'Vitamin', manufacturer: 'Norbrook', batch_number: 'BAT026', expiry_date: '2027-05-17', quantity: 48, unit_price: 31000, description: '', created_at: dp(2) },
        { medicine_id: 'med_027', medicine_name: 'Tetracycline Eye Ointment', category: 'Antibiotic', manufacturer: 'Intervet', batch_number: 'BAT027', expiry_date: '2026-10-20', quantity: 22, unit_price: 9000, description: '', created_at: dp(1) },
        { medicine_id: 'med_028', medicine_name: 'Florfenicol Injection', category: 'Antibiotic', manufacturer: 'Norbrook', batch_number: 'BAT028', expiry_date: '2027-07-11', quantity: 58, unit_price: 52000, description: '', created_at: dp(2) },
        { medicine_id: 'med_029', medicine_name: 'Povidone Iodine', category: 'Antiseptic', manufacturer: 'Bayer', batch_number: 'BAT029', expiry_date: '2028-01-22', quantity: 140, unit_price: 10000, description: '', created_at: dp(1) },
        { medicine_id: 'med_030', medicine_name: 'Chlorhexidine Solution', category: 'Disinfectant', manufacturer: 'Kepro', batch_number: 'BAT030', expiry_date: '2027-06-08', quantity: 75, unit_price: 16000, description: '', created_at: dp(1) }
    ];
    DB.saveMedicines(medicines);

    // Purchases
    const purchases = [
        { purchase_id: 'pur_001', supplier_id: 'sup_001', medicine_id: 'med_001', quantity: 50, buying_price: 28000, purchase_date: dp(3) },
        { purchase_id: 'pur_002', supplier_id: 'sup_002', medicine_id: 'med_002', quantity: 30, buying_price: 13000, purchase_date: dp(3) },
        { purchase_id: 'pur_003', supplier_id: 'sup_003', medicine_id: 'med_003', quantity: 40, buying_price: 34000, purchase_date: dp(2) },
        { purchase_id: 'pur_004', supplier_id: 'sup_001', medicine_id: 'med_004', quantity: 20, buying_price: 22000, purchase_date: dp(2) },
        { purchase_id: 'pur_005', supplier_id: 'sup_004', medicine_id: 'med_005', quantity: 80, buying_price: 17000, purchase_date: dp(2) },
        { purchase_id: 'pur_006', supplier_id: 'sup_002', medicine_id: 'med_006', quantity: 25, buying_price: 11000, purchase_date: dp(1) },
        { purchase_id: 'pur_007', supplier_id: 'sup_003', medicine_id: 'med_007', quantity: 30, buying_price: 45000, purchase_date: dp(4) },
        { purchase_id: 'pur_008', supplier_id: 'sup_004', medicine_id: 'med_010', quantity: 15, buying_price: 52000, purchase_date: dp(1) },
        { purchase_id: 'pur_009', supplier_id: 'sup_001', medicine_id: 'med_011', quantity: 40, buying_price: 38000, purchase_date: dp(1) },
        { purchase_id: 'pur_010', supplier_id: 'sup_003', medicine_id: 'med_013', quantity: 50, buying_price: 30000, purchase_date: dp(2) },
        { purchase_id: 'pur_011', supplier_id: 'sup_002', medicine_id: 'med_018', quantity: 60, buying_price: 8000, purchase_date: dp(1) },
        { purchase_id: 'pur_012', supplier_id: 'sup_004', medicine_id: 'med_022', quantity: 120, buying_price: 3500, purchase_date: dp(2) },
        { purchase_id: 'pur_013', supplier_id: 'sup_003', medicine_id: 'med_017', quantity: 20, buying_price: 50000, purchase_date: dp(3) },
        { purchase_id: 'pur_014', supplier_id: 'sup_002', medicine_id: 'med_020', quantity: 25, buying_price: 34000, purchase_date: dp(2) }
    ];
    DB.savePurchases(purchases);

    // Sales (last 30 days)
    const pd = (days) => {
        const dd = new Date(today);
        dd.setDate(dd.getDate() - days);
        return dd.toISOString().split('T')[0];
    };
    const sales = [
        { sale_id: 'sal_001', medicine_id: 'med_001', quantity: 3, selling_price: 35000, total_amount: 105000, sale_date: pd(0) },
        { sale_id: 'sal_002', medicine_id: 'med_005', quantity: 10, selling_price: 22000, total_amount: 220000, sale_date: pd(0) },
        { sale_id: 'sal_003', medicine_id: 'med_003', quantity: 2, selling_price: 42000, total_amount: 84000, sale_date: pd(1) },
        { sale_id: 'sal_004', medicine_id: 'med_009', quantity: 4, selling_price: 38000, total_amount: 152000, sale_date: pd(2) },
        { sale_id: 'sal_005', medicine_id: 'med_010', quantity: 1, selling_price: 65000, total_amount: 65000, sale_date: pd(3) },
        { sale_id: 'sal_006', medicine_id: 'med_001', quantity: 5, selling_price: 35000, total_amount: 175000, sale_date: pd(5) },
        { sale_id: 'sal_007', medicine_id: 'med_003', quantity: 3, selling_price: 42000, total_amount: 126000, sale_date: pd(7) },
        { sale_id: 'sal_008', medicine_id: 'med_005', quantity: 8, selling_price: 22000, total_amount: 176000, sale_date: pd(10) },
        { sale_id: 'sal_009', medicine_id: 'med_009', quantity: 2, selling_price: 38000, total_amount: 76000, sale_date: pd(14) },
        { sale_id: 'sal_010', medicine_id: 'med_010', quantity: 2, selling_price: 65000, total_amount: 130000, sale_date: pd(20) },
        { sale_id: 'sal_011', medicine_id: 'med_012', quantity: 2, selling_price: 52000, total_amount: 104000, sale_date: pd(1) },
        { sale_id: 'sal_012', medicine_id: 'med_014', quantity: 5, selling_price: 25000, total_amount: 125000, sale_date: pd(2) },
        { sale_id: 'sal_013', medicine_id: 'med_019', quantity: 8, selling_price: 8500, total_amount: 68000, sale_date: pd(3) },
        { sale_id: 'sal_014', medicine_id: 'med_022', quantity: 25, selling_price: 5000, total_amount: 125000, sale_date: pd(4) },
        { sale_id: 'sal_015', medicine_id: 'med_011', quantity: 4, selling_price: 48000, total_amount: 192000, sale_date: pd(6) },
        { sale_id: 'sal_016', medicine_id: 'med_020', quantity: 3, selling_price: 42000, total_amount: 126000, sale_date: pd(8) },
        { sale_id: 'sal_017', medicine_id: 'med_016', quantity: 2, selling_price: 32000, total_amount: 64000, sale_date: pd(12) },
        { sale_id: 'sal_018', medicine_id: 'med_018', quantity: 10, selling_price: 12000, total_amount: 120000, sale_date: pd(15) }
    ];
    DB.saveSales(sales);

    // Generate alerts
    DB.checkAndGenerateAlerts();

    localStorage.setItem(DB.keys.initialized, SEED_VERSION);
    console.log('AgroDrop database seeded successfully.');
}

// seedDatabase() called from app.js after App is ready
