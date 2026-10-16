# TeamLink Backend API

Team collaboration platform backend built with Node.js, Express, and MongoDB.

## Stage 1: Authentication System ✅

### Features
- User Registration
- User Login
- JWT Authentication
- Profile Management
- Input Validation

### API Endpoints

#### Public Routes
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

#### Protected Routes (Requires Token)
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/teamlink
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRE=7d
NODE_ENV=development
```

3. Start MongoDB service

4. Run the server:
```bash
npm run dev
```

### Testing with Postman

#### 1. Register User
```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "Urvil Rathod",
  "email": "ur23aai@herts.ac.uk",
  "password": "password123"
}
```

#### 2. Login
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "ur23aai@herts.ac.uk",
  "password": "password123"
}
```

#### 3. Get Profile (Use token from login)
```
GET http://localhost:5000/api/auth/me
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

#### 4. Update Profile
```
PUT http://localhost:5000/api/auth/profile
Authorization: Bearer YOUR_JWT_TOKEN_HERE
Content-Type: application/json

{
  "name": "Urvil Updated"
}
```

## Author
**ur23aai** - University of Hertfordshire

## License
ISC