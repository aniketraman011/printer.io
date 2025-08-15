const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const mongoUri = process.env.MONGODB_URI;

// Connect to MongoDB
mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB connected for admin creation.'))
  .catch(err => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['customer', 'admin'] }
});
const User = mongoose.model('User', userSchema);

const createAdmin = async () => {
  try {
    const email = 'admin@example.com';
    const password = 'adminpassword';
    const role = 'admin';

    let user = await User.findOne({ email });
    if (user) {
      console.log('Admin user already exists.');
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      email,
      password: hashedPassword,
      role
    });

    await user.save();
    console.log('Admin user created successfully!');
  } catch (err) {
    console.error('Error creating admin user:', err);
  } finally {
    mongoose.connection.close();
  }
};

createAdmin();
