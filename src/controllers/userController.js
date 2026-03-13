import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

export const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    const user = new User({ name, email, password, role });
    await user.save();
    res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password.' });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
};

// Utility: Create a test user for sign-in
export const createTestUser = async () => {
  const testUser = {
    name: 'Test Sponsor',
    email: 'sponsor@example.com',
    password: 'Test@1234',
    role: 'sponsor'
  };
  try {
    const exists = await User.findOne({ email: testUser.email });
    if (!exists) {
      const user = new User(testUser);
      await user.save();
      console.log('Test user created:', user);
    } else {
      console.log('Test user already exists.');
    }
  } catch (err) {
    console.error('Error creating test user:', err.message);
  }
};
