# AgroDrop - Node.js Backend Integration Guide

## Overview

This guide explains how to integrate the AgroDrop Node.js/Express backend with your existing frontend. The backend uses MongoDB for data persistence instead of localStorage.

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Frontend  │         │   Express    │         │  MongoDB    │
│  (HTML/CSS) │◄───────►│   Backend    │◄───────►│  Database   │
│   (JS/API)  │ HTTP    │   (API REST) │ TCP     │  (Data)     │
└─────────────┘         └──────────────┘         └─────────────┘
```

## What's Included

### Backend Components

1. **Server** (`backend/server.js`)
   - Express application setup
   - CORS configuration
   - Error handling
   - Route mounting

2. **Database Models** (`backend/models/`)
   - User.js - User authentication & management
   - Medicine.js - Medicine inventory
   - Supplier.js - Supplier information
   - Purchase.js - Purchase transactions
   - Sale.js - Sales transactions
   - Alert.js - System alerts

3. **API Routes** (`backend/routes/`)
   - auth.routes.js - Login, register, auth
   - users.routes.js - User CRUD operations
   - medicines.routes.js - Medicine management
   - suppliers.routes.js - Supplier management
   - purchases.routes.js - Purchase tracking
   - sales.routes.js - Sales tracking
   - alerts.routes.js - Alert management
   - reports.routes.js - Analytics & reports

4. **Middleware** (`backend/middleware/`)
   - auth.js - JWT authentication & authorization

5. **Frontend API Wrapper** (`js/api.js`)
   - Replaces localStorage with API calls
   - Handles JWT token management
   - Provides async/await interface

## Installation

### Step 1: Install Node.js Dependencies

```bash
cd backend
npm install
```

### Step 2: Setup MongoDB

#### Option A: Local MongoDB
```bash
# Install MongoDB Community Edition
# Windows: https://www.mongodb.com/try/download/community
# Mac: brew install mongodb-community
# Linux: Follow MongoDB official docs

# Start MongoDB
mongod
```

#### Option B: MongoDB Atlas (Cloud)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Copy the connection string
4. Add to `.env` file

### Step 3: Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/agrodrop
JWT_SECRET=your_super_secret_key_change_this
FRONTEND_URL=http://localhost:8000
CORS_ORIGIN=*
```

### Step 4: Start Backend

```bash
npm run dev
```

You should see:
```
╔════════════════════════════════════════╗
║    AgroDrop API Server Started        ║
║    Environment: development           ║
║    Port: 5000                         ║
║    URL: http://localhost:5000         ║
╚════════════════════════════════════════╝
```

## Frontend Integration

### Option 1: Replace data.js with api.js

In your HTML files, replace:

```html
<!-- OLD (localStorage) -->
<script src="js/data.js"></script>

<!-- NEW (Backend API) -->
<script src="js/api.js"></script>
```

### Option 2: Hybrid Approach (Recommended for Migration)

Keep both files and switch on demand:

```html
<script src="js/data.js"></script>  <!-- Fallback -->
<script src="js/api.js"></script>   <!-- Primary -->
```

Then in your code:
```javascript
// Use API if available, fall back to DB
const DB = typeof API !== 'undefined' ? API : DB;
```

### Option 3: Async/Await with API

Update your functions to be async:

```javascript
// Before (localStorage - synchronous)
function loadMedicines() {
  const meds = DB.getMedicines();
  renderTable(meds);
}

// After (Backend API - asynchronous)
async function loadMedicines() {
  const meds = await API.getMedicines();
  renderTable(meds);
}
```

## Key API Changes

### Authentication

```javascript
// Login
const result = await API.login('admin@agrodrop.com', 'admin123');
if (result.status === 'success') {
  const token = result.token;
  // Token is automatically saved and sent with all requests
}

// Get current user
const response = await API.getCurrentUser();
const user = response.user;
```

### Medicines

```javascript
// Get all medicines
const medicines = await API.getMedicines();

// Get medicines with filters
const antibiotics = await API.getMedicines('Antibiotic');

// Search medicines
const results = await API.getMedicines('', 'Oxytetracycline');

// Add new medicine
const result = await API.addMedicine({
  medicine_name: 'Amoxicillin 500mg',
  category: 'Antibiotic',
  manufacturer: 'Norbrook',
  batch_number: 'BT2024001',
  expiry_date: '2025-12-31',
  quantity: 100,
  unit_price: 25000,
  description: 'Broad-spectrum antibiotic'
});

// Update medicine
await API.updateMedicine(medicineId, { quantity: 50 });

// Delete medicine
await API.deleteMedicine(medicineId);
```

### Sales & Purchases

```javascript
// Create sale (automatically deducts stock)
const result = await API.addSale({
  medicine_id: medicineId,
  quantity: 5,
  selling_price: 35000,
  sale_date: '2024-06-23',
  payment_method: 'Cash'
});

// Create purchase (automatically adds stock)
const result = await API.addPurchase({
  supplier_id: supplierId,
  medicine_id: medicineId,
  quantity: 50,
  buying_price: 28000,
  purchase_date: '2024-06-23'
});

// Get sales
const sales = await API.getSales();

// Get purchases
const purchases = await API.getPurchases();
```

### Alerts

```javascript
// Get alerts
const alerts = await API.getAlerts();

// Mark as read
await API.markAlertRead(alertId);

// Mark all as read
await API.markAllAlertsRead();
```

## Migration Steps

### Step 1: Backup Current Data

If you have localStorage data you want to keep:

```javascript
// In browser console
const backup = {
  users: JSON.parse(localStorage.getItem('agrodrop_users')),
  medicines: JSON.parse(localStorage.getItem('agrodrop_medicines')),
  suppliers: JSON.parse(localStorage.getItem('agrodrop_suppliers')),
  purchases: JSON.parse(localStorage.getItem('agrodrop_purchases')),
  sales: JSON.parse(localStorage.getItem('agrodrop_sales'))
};
console.log(JSON.stringify(backup));
```

### Step 2: Update HTML Files

Update all `.html` files to use the API wrapper:

```html
<!-- Before -->
<script src="js/data.js"></script>
<script src="js/app.js"></script>

<!-- After -->
<script src="js/api.js"></script>
<script src="js/app.js"></script>
```

### Step 3: Update JavaScript Functions

Make functions async and use `await`:

**inventory.js example:**

```javascript
// Before
function loadMeds() {
  allMeds = DB.getMedicines();
  applyFilters();
}

// After
async function loadMeds() {
  allMeds = await API.getMedicines();
  applyFilters();
}
```

### Step 4: Update Event Handlers

Make event handlers async:

```javascript
// Before
function saveMedicine() {
  const data = { /* ... */ };
  DB.addMedicine(data);
  Toast.show('success', 'Added!', 'Medicine added');
  loadMeds();
}

// After
async function saveMedicine() {
  const data = { /* ... */ };
  const result = await API.addMedicine(data);
  if (result.status === 'success') {
    Toast.show('success', 'Added!', result.message);
    await loadMeds();
  } else {
    Toast.show('error', 'Error', result.message);
  }
}
```

### Step 5: Update Login Page

Update `index.html` login form:

```javascript
// Before
const user = DB.getUserByEmail(email);
if (user && user.password === password) {
  App.setCurrentUser(user);
  window.location.href = 'dashboard.html';
}

// After
const result = await API.login(email, password);
if (result.status === 'success') {
  window.location.href = 'dashboard.html';
} else {
  Toast.show('error', 'Login Failed', result.message);
}
```

## Error Handling

All API calls return a status response:

```javascript
{
  status: 'success' | 'error',
  message: 'Descriptive message',
  data: {...}  // Only on success
}
```

Handle errors properly:

```javascript
try {
  const result = await API.addMedicine(data);
  
  if (result.status === 'success') {
    Toast.show('success', 'Success', result.message);
  } else {
    Toast.show('error', 'Error', result.message);
  }
} catch (error) {
  Toast.show('error', 'Network Error', error.message);
}
```

## Testing API Endpoints

### Using cURL

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@agrodrop.com","password":"admin123"}'

# Get medicines (replace TOKEN with actual token)
curl -X GET http://localhost:5000/api/medicines \
  -H "Authorization: Bearer TOKEN"

# Create medicine
curl -X POST http://localhost:5000/api/medicines \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "medicine_name":"Penicillin",
    "category":"Antibiotic",
    "expiry_date":"2025-12-31",
    "quantity":100,
    "unit_price":15000
  }'
```

### Using Postman

1. Import the collection from API documentation
2. Set up environment variables:
   - `base_url` = http://localhost:5000
   - `token` = (obtained from login response)
3. Test each endpoint

## Performance Optimization

### 1. Pagination

```javascript
// Get sales with pagination
const response = await fetch(
  'http://localhost:5000/api/sales?skip=0&limit=10'
);
```

### 2. Filtering

```javascript
// Get medicines by category
const medicines = await API.getMedicines('Antibiotic');

// Get medicines with search
const results = await API.getMedicines('', 'search_term');
```

### 3. Caching

```javascript
// Cache API responses
let medicinesCache = null;
let cacheTime = null;

async function getMedicinesCached() {
  if (medicinesCache && Date.now() - cacheTime < 5 * 60 * 1000) {
    return medicinesCache;
  }
  medicinesCache = await API.getMedicines();
  cacheTime = Date.now();
  return medicinesCache;
}
```

## Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker
```bash
docker-compose up -d
```

### Cloud Deployment

#### Heroku
```bash
heroku create agrodrop-backend
git push heroku main
```

#### AWS/Google Cloud/Azure
- Package as Docker container
- Deploy to container service
- Configure environment variables
- Use managed MongoDB Atlas

## Troubleshooting

### API Not Responding
```bash
# Check if backend is running
curl http://localhost:5000/api/health

# Check backend logs
npm run dev

# Verify MongoDB is running
mongosh
```

### CORS Errors
```bash
# Update .env
CORS_ORIGIN=http://localhost:8000

# Restart backend
```

### Authentication Errors
```javascript
// Check if token is saved
console.log(localStorage.getItem('agrodrop_token'));

// Login again
const result = await API.login(email, password);
```

### Data Not Syncing
- Clear browser cache and localStorage
- Check browser console for errors
- Verify API endpoints are accessible
- Check MongoDB connection

## Support & Documentation

- API Documentation: See `backend/SETUP.md`
- Express.js: https://expressjs.com/
- MongoDB: https://docs.mongodb.com/
- JWT Auth: https://jwt.io/

---

**Your AgroDrop application is now ready to use with a professional Node.js backend!** 🚀
