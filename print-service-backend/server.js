// server.js

// Import necessary packages
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

// Initialize Express app
const app = express();

// --- Middleware Setup ---
// Enable Cross-Origin Resource Sharing for your React app to connect
app.use(cors({
  origin: 'https://guileless-tulumba-5abac1.netlify.app' // Replace with your React app's URL
}));
// Parse incoming JSON requests
app.use(express.json());
// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Database Connection ---
const mongoUri = process.env.MONGODB_URI;
const jwtSecret = process.env.JWT_SECRET || 'your-secret-key'; // Use a strong, secret key
mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB connected successfully!'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- Multer for File Uploads ---
// Configure disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// --- MongoDB Schemas and Models ---

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['customer', 'admin'] }
});
const User = mongoose.model('User', userSchema);

// Order Schema (updated to store file paths)
const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  year: { type: String, required: true },
  semester: { type: String, required: true },
  printSide: { type: String, required: true },
  pages: { type: Number, required: true },
  copies: { type: Number, required: true },
  message: { type: String },
  filePaths: [String], // Array of strings to store file paths
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['Pending', 'Payment Confirmed', 'Printing', 'Ready for Pickup', 'Completed'] 
  },
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

// --- Middleware for JWT Authentication ---
const authMiddleware = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied: Admin role required' });
  }
  next();
};

// --- API Routes ---

// @route POST /api/auth/register
// @desc Register a new user
app.post('/api/auth/register', async (req, res) => {
  const { email, password, role } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    user = new User({ email, password, role });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    const payload = { user: { id: user.id, role: user.role } };
    const token = jwt.sign(payload, jwtSecret, { expiresIn: 360000 });
    res.status(201).json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route POST /api/auth/login
// @desc Authenticate user and get token
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid Credentials' });
    }
    const payload = { user: { id: user.id, role: user.role } };
    const token = jwt.sign(payload, jwtSecret, { expiresIn: 360000 });
    res.json({ token, role: user.role });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route GET /api/auth/user
// @desc Get current user data
app.get('/api/auth/user', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route GET /api/orders
// @desc Get all orders (Protected - Admin only)
app.get('/api/orders', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders', error: error.message });
  }
});

// @route GET /api/orders/customer
// @desc Get orders for the current user (Protected)
app.get('/api/orders/customer', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching customer orders', error: error.message });
  }
});

// @route POST /api/orders
// @desc Create a new order with file uploads
app.post('/api/orders', authMiddleware, upload.array('files'), async (req, res) => {
  try {
    const filePaths = req.files ? req.files.map(file => file.path) : [];
    const newOrder = new Order({
      ...req.body,
      filePaths,
      userId: req.user.id,
      status: 'Pending',
    });
    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Error creating order', error: error.message });
  }
});

// @route PATCH /api/orders/:id/status
// @desc Update an order's status (Protected - Admin only)
app.patch('/api/orders/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );
    if (!updatedOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(400).json({ message: 'Error updating order status', error: error.message });
  }
});

// --- Start the Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});