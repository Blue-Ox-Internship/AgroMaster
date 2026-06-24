# AgroDrop Backend Setup Guide

## Prerequisites

- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)
- MongoDB (v4.0 or higher)

## Installation Steps

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Copy the `.env.example` file to `.env` and configure it:

```bash
cp .env.example .env
```

Edit `.env` file and update:
- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - A strong secret key for JWT tokens
- `PORT` - Server port (default: 5000)
- `FRONTEND_URL` - Frontend application URL

### 4. Start MongoDB

Make sure MongoDB is running:

```bash
# On Windows (if installed locally)
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in .env with your Atlas connection string
```

### 5. Run the Server

**Development Mode (with auto-reload):**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Users (Admin only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Medicines
- `GET /api/medicines` - Get all medicines
- `GET /api/medicines/:id` - Get medicine by ID
- `POST /api/medicines` - Create medicine
- `PUT /api/medicines/:id` - Update medicine
- `DELETE /api/medicines/:id` - Delete medicine

### Suppliers
- `GET /api/suppliers` - Get all suppliers
- `GET /api/suppliers/:id` - Get supplier by ID
- `POST /api/suppliers` - Create supplier
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

### Purchases
- `GET /api/purchases` - Get all purchases
- `GET /api/purchases/:id` - Get purchase by ID
- `POST /api/purchases` - Create purchase
- `DELETE /api/purchases/:id` - Delete purchase

### Sales
- `GET /api/sales` - Get all sales
- `GET /api/sales/:id` - Get sale by ID
- `GET /api/sales/stats/daily` - Get daily stats
- `POST /api/sales` - Create sale
- `DELETE /api/sales/:id` - Delete sale

### Alerts
- `GET /api/alerts` - Get all alerts
- `GET /api/alerts/:id` - Get alert by ID
- `PATCH /api/alerts/:id/read` - Mark alert as read
- `PATCH /api/alerts/all/read` - Mark all as read

### Reports
- `GET /api/reports/stock` - Stock report
- `GET /api/reports/sales` - Sales report
- `GET /api/reports/expiry` - Expiry report
- `GET /api/reports/suppliers` - Supplier report
- `GET /api/reports/dashboard/stats` - Dashboard statistics

## Frontend Integration

The frontend is already configured to use the API. To switch from localStorage to backend:

1. Replace `data.js` with `api.js` in your HTML files
2. Or modify the `DB` object to use API calls
3. Update API_BASE_URL if your server is on a different port/domain

### Example HTML Update:

**Before (using localStorage):**
```html
<script src="js/data.js"></script>
```

**After (using backend API):**
```html
<script src="js/api.js"></script>
```

Then update your code to use `API` instead of `DB`:
```javascript
// Old
const medicines = DB.getMedicines();

// New (with API)
const medicines = await API.getMedicines();
```

## Database Schema

### Users
- full_name, email, phone, business_name, password, role
- Roles: Administrator, Store Manager, Sales Attendant

### Medicines
- medicine_name, category, manufacturer, batch_number
- expiry_date, quantity, unit_price, description

### Suppliers
- supplier_name, phone, email, address, contact_person

### Purchases
- supplier_id, medicine_id, quantity, buying_price, purchase_date

### Sales
- medicine_id, quantity, selling_price, sale_date, payment_method

### Alerts
- medicine_id, alert_type, message, status, severity

## Testing with cURL

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@agrodrop.com","password":"admin123"}'
```

### Get Medicines
```bash
curl -X GET http://localhost:5000/api/medicines \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create Sale
```bash
curl -X POST http://localhost:5000/api/sales \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "medicine_id":"...",
    "quantity":5,
    "selling_price":35000,
    "sale_date":"2024-06-23"
  }'
```

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check MONGODB_URI in .env file
- Verify database credentials

### CORS Error
- Check CORS_ORIGIN in .env
- Ensure frontend URL is whitelisted
- Add to CORS_ORIGIN: `http://localhost:8000`

### Port Already in Use
- Change PORT in .env file
- Or kill the process using the port

### JWT Token Expired
- Tokens expire after the JWT_EXPIRY duration (default: 7 days)
- User needs to login again to get a new token

## Production Deployment

1. Set `NODE_ENV=production` in .env
2. Use a production MongoDB (MongoDB Atlas)
3. Generate a strong JWT_SECRET
4. Deploy using PM2, Docker, or cloud platforms (Heroku, AWS, etc.)
5. Configure CORS_ORIGIN for your production frontend URL

## Performance Tips

- Create MongoDB indexes for frequently searched fields
- Implement pagination for large datasets
- Cache frequently accessed data
- Use connection pooling for database
- Enable compression for API responses

## Support

For issues or questions, contact the development team.
