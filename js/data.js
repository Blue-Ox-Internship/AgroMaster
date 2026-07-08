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
const SEED_VERSION = 'v4'; // bumped – added 15 veterinary medicines, purchases, sales

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
        {
            medicine_id: 'med_001', medicine_name: 'Oxytetracycline 20%', category: 'Antibiotic',
            manufacturer: 'Norbrook', batch_number: 'BT2024001', expiry_date: d(18),
            quantity: 45, unit_price: 35000, description: 'Broad-spectrum antibiotic for bacterial infections in cattle, poultry, and pigs.',
            created_at: dp(3)
        },
        {
            medicine_id: 'med_002', medicine_name: 'Albendazole 2.5%', category: 'Antiparasitic',
            manufacturer: 'Elanco', batch_number: 'BT2024002', expiry_date: d(24),
            quantity: 7, unit_price: 18000, description: 'Broad-spectrum anthelmintic for treatment of gastrointestinal worms.',
            created_at: dp(3)
        },
        {
            medicine_id: 'med_003', medicine_name: 'Ivermectin 1%', category: 'Antiparasitic',
            manufacturer: 'Kepro', batch_number: 'BT2024003', expiry_date: d(12),
            quantity: 30, unit_price: 42000, description: 'Injectable solution for treatment of internal and external parasites.',
            created_at: dp(2)
        },
        {
            medicine_id: 'med_004', medicine_name: 'Penicillin G 200MIU', category: 'Antibiotic',
            manufacturer: 'Norbrook', batch_number: 'BT2024004', expiry_date: d(2),
            quantity: 8, unit_price: 28000, description: 'Injectable penicillin for gram-positive bacterial infections.',
            created_at: dp(2)
        },
        {
            medicine_id: 'med_005', medicine_name: 'Tetracycline HCl Powder', category: 'Antibiotic',
            manufacturer: 'Intervet', batch_number: 'BT2024005', expiry_date: d(15),
            quantity: 60, unit_price: 22000, description: 'Soluble antibiotic powder for poultry and pigs via drinking water.',
            created_at: dp(2)
        },
        {
            medicine_id: 'med_006', medicine_name: 'Multivitamin ADE', category: 'Supplement',
            manufacturer: 'Elanco', batch_number: 'BT2024006', expiry_date: d(20),
            quantity: 5, unit_price: 15000, description: 'Vitamin A, D3 and E supplement for deficiency correction and immune support.',
            created_at: dp(1)
        },
        {
            medicine_id: 'med_007', medicine_name: 'Acaricide Dip (Amitraz 12.5%)', category: 'Pesticide',
            manufacturer: 'Kepro', batch_number: 'BT2024007', expiry_date: d(-2),
            quantity: 25, unit_price: 55000, description: 'Tick and mite control via cattle dipping or spraying.',
            created_at: dp(4)
        },
        {
            medicine_id: 'med_008', medicine_name: 'Dewormer Suspension (Levamisole)', category: 'Antiparasitic',
            manufacturer: 'Intervet', batch_number: 'BT2024008', expiry_date: d(10),
            quantity: 3, unit_price: 12000, description: 'Oral dewormer effective against roundworms and lungworms.',
            created_at: dp(1)
        },
        {
            medicine_id: 'med_009', medicine_name: 'Antifungal Spray (Clotrimazole)', category: 'Antifungal',
            manufacturer: 'Norbrook', batch_number: 'BT2024009', expiry_date: d(16),
            quantity: 20, unit_price: 38000, description: 'Topical antifungal for ringworm and skin fungal infections.',
            created_at: dp(1)
        },
        {
            medicine_id: 'med_010', medicine_name: 'Meloxicam 20mg/ml Injectable', category: 'Anti-inflammatory',
            manufacturer: 'Elanco', batch_number: 'BT2024010', expiry_date: d(14),
            quantity: 12, unit_price: 65000, description: 'NSAID for pain and inflammation management in cattle and pigs.',
            created_at: dp(1)
        },
        {
            medicine_id: 'med_011', medicine_name: 'Tylosin 200mg/ml', category: 'Antibiotic',
            manufacturer: 'Elanco', batch_number: 'BT2025001', expiry_date: d(22),
            quantity: 35, unit_price: 48000, description: 'Macrolide antibiotic for respiratory and enteric infections in swine and poultry.',
            created_at: dp(1)
        },
        {
            medicine_id: 'med_012', medicine_name: 'Enrofloxacin 10%', category: 'Antibiotic',
            manufacturer: 'Bayer', batch_number: 'BT2025002', expiry_date: d(16),
            quantity: 18, unit_price: 52000, description: 'Fluoroquinolone for respiratory and urinary tract infections in livestock.',
            created_at: dp(2)
        },
        {
            medicine_id: 'med_013', medicine_name: 'Amoxicillin 15% LA', category: 'Antibiotic',
            manufacturer: 'Norbrook', batch_number: 'BT2025003', expiry_date: d(20),
            quantity: 40, unit_price: 38000, description: 'Long-acting penicillin for wound infections and respiratory cases.',
            created_at: dp(2)
        },
        {
            medicine_id: 'med_014', medicine_name: 'Sulphadiazine/Trimethoprim 48%', category: 'Antibiotic',
            manufacturer: 'Intervet', batch_number: 'BT2025004', expiry_date: d(14),
            quantity: 22, unit_price: 25000, description: 'Potentiated sulfonamide for broad-spectrum bacterial and coccidial infections.',
            created_at: dp(1)
        },
        {
            medicine_id: 'med_015', medicine_name: 'Cloxacillin 500mg Intramammary', category: 'Antibiotic',
            manufacturer: 'Norbrook', batch_number: 'BT2025005', expiry_date: d(18),
            quantity: 15, unit_price: 45000, description: 'Intramammary infusion for mastitis treatment in lactating dairy cows.',
            created_at: dp(2)
        },
        {
            medicine_id: 'med_016', medicine_name: 'Triclabendazole 10%', category: 'Antiparasitic',
            manufacturer: 'Kepro', batch_number: 'BT2025006', expiry_date: d(24),
            quantity: 10, unit_price: 32000, description: 'Flukicide for treatment of liver fluke (Fasciola) in cattle and sheep.',
            created_at: dp(2)
        },
        {
            medicine_id: 'med_017', medicine_name: 'Deltamethrin 1% Pour-On', category: 'Pesticide',
            manufacturer: 'Bayer', batch_number: 'BT2025007', expiry_date: d(12),
            quantity: 14, unit_price: 62000, description: 'Synthetic pyrethroid for control of ticks, flies and lice on cattle.',
            created_at: dp(3)
        },
        {
            medicine_id: 'med_018', medicine_name: 'Iron Dextran 20%', category: 'Supplement',
            manufacturer: 'Elanco', batch_number: 'BT2025008', expiry_date: d(30),
            quantity: 50, unit_price: 12000, description: 'Injectable iron supplement for prevention of piglet anaemia.',
            created_at: dp(1)
        },
        {
            medicine_id: 'med_019', medicine_name: 'Vitamin B Complex', category: 'Supplement',
            manufacturer: 'Kepro', batch_number: 'BT2025009', expiry_date: d(18),
            quantity: 28, unit_price: 8500, description: 'B-complex vitamins for metabolic support and appetite stimulation.',
            created_at: dp(1)
        },
        {
            medicine_id: 'med_020', medicine_name: 'Ketoprofen 10%', category: 'Anti-inflammatory',
            manufacturer: 'Norbrook', batch_number: 'BT2025010', expiry_date: d(14),
            quantity: 20, unit_price: 42000, description: 'NSAID for pain relief, fever reduction and inflammation in livestock.',
            created_at: dp(2)
        },
        {
            medicine_id: 'med_021', medicine_name: 'Flunixin Meglumine 5%', category: 'Anti-inflammatory',
            manufacturer: 'Intervet', batch_number: 'BT2025011', expiry_date: d(10),
            quantity: 6, unit_price: 55000, description: 'Potent NSAID for endotoxemia, mastitis and musculoskeletal pain.',
            created_at: dp(1)
        },
        {
            medicine_id: 'med_022', medicine_name: 'Newcastle Disease Vaccine (LaSota)', category: 'Vaccine',
            manufacturer: 'Intervet', batch_number: 'BT2025012', expiry_date: d(6),
            quantity: 100, unit_price: 5000, description: 'Live vaccine for prevention of Newcastle disease in poultry.',
            created_at: dp(2)
        },
        {
            medicine_id: 'med_023', medicine_name: 'Oxytocin 10 IU/ml', category: 'Other',
            manufacturer: 'Bayer', batch_number: 'BT2025013', expiry_date: d(8),
            quantity: 9, unit_price: 15000, description: 'Hormonal injectable for uterine contractions and milk letdown in cattle.',
            created_at: dp(1)
        },
        {
            medicine_id: 'med_024', medicine_name: 'Colistin 10% Oral Powder', category: 'Antibiotic',
            manufacturer: 'Kepro', batch_number: 'BT2025014', expiry_date: d(20),
            quantity: 33, unit_price: 28000, description: 'Polypeptide antibiotic for enteric infections, especially E. coli in poultry.',
            created_at: dp(2)
        },
        {
            medicine_id: 'med_025', medicine_name: 'Praziquantel 50mg Tablets', category: 'Antiparasitic',
            manufacturer: 'Elanco', batch_number: 'BT2025015', expiry_date: d(36),
            quantity: 2, unit_price: 7500, description: 'Oral treatment for tapeworm infections in dogs, cats and poultry.',
            created_at: dp(1)
        }
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
