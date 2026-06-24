# AgroDrop Quick Start Guide

## Option 1: Using Docker Compose (Recommended)

### Requirements
- Docker installed on your system
- Docker Compose

### Quick Start

```bash
# 1. Navigate to project directory
cd agrodrop

# 2. Start all services (MongoDB, Backend, Frontend)
docker-compose up -d

# 3. Wait for services to be ready (30-60 seconds)

# 4. Access the application
# Frontend: http://localhost
# Backend API: http://localhost:5000/api
# MongoDB: localhost:27017
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
docker-compose logs -f backend
```

---

## Option 2: Manual Setup

### Backend Setup

```bash
# 1. Install MongoDB (if not already installed)
# - Windows: https://www.mongodb.com/try/download/community
# - Mac: brew install mongodb-community
# - Linux: Follow MongoDB docs

# 2. Start MongoDB
mongod

# 3. Navigate to backend folder
cd backend

# 4. Install dependencies
npm install

# 5. Copy and configure .env
cp .env.example .env
# Edit .env and update MongoDB URI if needed

# 6. Start backend server
npm run dev
# Server will run on http://localhost:5000
```

### Frontend Setup

```bash
# 1. Open any browser and navigate to project folder
# Or start a local server:

# Using Python 3:
python -m http.server 8000

# Using Python 2:
python -m SimpleHTTPServer 8000

# Using Node (http-server):
npm install -g http-server
http-server

# 2. Open http://localhost:8000 in your browser
```

---

## Default Login Credentials

```
Admin:
- Email: admin@agrodrop.com
- Password: admin123

Manager:
- Email: manager@agrodrop.com
- Password: manager123

Sales:
- Email: sales@agrodrop.com
- Password: sales123
```

---

## Switching Between localStorage and Backend API

### Using localStorage (Current Setup)
```html
<script src="js/data.js"></script>
```

### Using Backend API
```html
<script src="js/api.js"></script>
```

Then in your JavaScript files, replace `DB` with `API`:

```javascript
// Old (localStorage)
const medicines = DB.getMedicines();

// New (Backend API)
const medicines = await API.getMedicines();
```

---

## Troubleshooting

### Backend won't start
```bash
# Check if port 5000 is in use
# Windows:
netstat -ano | findstr :5000

# Kill process using port 5000
taskkill /PID <PID> /F
```

### MongoDB connection error
```bash
# Verify MongoDB is running
# Windows: Check Services -> MongoDB
# Mac/Linux: brew services list

# Check connection string in .env
MONGODB_URI=mongodb://localhost:27017/agrodrop
```

### Frontend can't reach API
- Ensure backend is running on port 5000
- Check CORS_ORIGIN in backend .env
- Clear browser cache and cookies
- Check browser console for error messages

### Port Already in Use
Change the port in `.env`:
```
PORT=5001
```

---

## File Structure

```
agrodrop/
├── frontend files (html, css, js)
├── backend/
│   ├── package.json
│   ├── server.js
│   ├── .env.example
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   └── config/
├── docker-compose.yml
├── Dockerfile
└── nginx.conf
```

---

## Next Steps

1. ✅ Start the server
2. ✅ Login with demo credentials
3. ✅ Add some test data
4. ✅ Explore all features
5. ✅ Customize for your needs

---

## Additional Resources

- Backend API Documentation: See `backend/SETUP.md`
- API Endpoints: Available at `http://localhost:5000/api/`
- MongoDB Documentation: https://docs.mongodb.com/
- Express.js Guide: https://expressjs.com/

---

## Getting Help

If you encounter issues:
1. Check the troubleshooting section above
2. Review backend SETUP.md
3. Check browser console for error messages
4. Review backend logs: `docker-compose logs backend`

Good luck! 🚀
