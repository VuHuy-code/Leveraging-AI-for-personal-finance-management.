const express = require('express');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

// Mock user database
const users = {};

// Sign up
app.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  if (users[email]) {
    return res.status(400).json({ message: 'Email already exists' });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  users[email] = hashedPassword;
  res.json({ message: 'User registered successfully' });
});

// Sign in
app.post('/signin', async (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = users[email];
  if (!hashedPassword) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }
  const match = await bcrypt.compare(password, hashedPassword);
  if (!match) {
    return res.status(400).json({ message: 'Invalid credentials' });
  }
  res.json({ message: 'Logged in successfully' });
});

app.listen(3000, () => console.log('Server running on port 3000'));