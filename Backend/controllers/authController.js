// controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');

exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash the password before saving it to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.login = async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        console.log("User not found for email:", email);
        return res.status(404).json({ error: 'User not found' });
      }
  
      console.log("Retrieved user:", user);
  
      // Trim and convert both passwords to strings before comparison
      const inputPassword = String(password).trim();
      const hashedPassword = user.password.toString('base64'); // Convert the hashed password to a base64 string
  
      // Compare the input password with the hashed password from the database
      const validPassword = await bcrypt.compare(inputPassword, hashedPassword);
      if (!validPassword) {
        console.log("Invalid password for user:", email);
        return res.status(401).json({ error: 'Invalid password' });
      }
  
      console.log("User authenticated successfully:", email);
  
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
      res.json({ token });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ error: error.message });
    }
  };


  