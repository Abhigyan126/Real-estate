const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const session = require('express-session');

const app = express();
const port = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: '4bcefce6907d2be9b7be9c7763ed61b708e51d7a1cf648964b48da7effa97dd8',
  resave: false,
  saveUninitialized: true
}));

// Database connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'passwoard',
  database: 'real_estate'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database');
});

// Routes
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const loginQuery = 'SELECT * FROM users WHERE username = ? AND password = ?';
  connection.query(loginQuery, [username, password], (err, results) => {
    if (err) {
      console.error('Error retrieving user:', err);
      res.send('An error occurred while retrieving the user');
      return;
    }

    if (results.length === 0) {
      res.render('login', { error: 'Invalid username or password' });
      return;
    }

    req.session.username = username; // Store username in session
    res.redirect('/dashboard');
  });
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.post('/signup', (req, res) => {
  const { username, password } = req.body;

  const signupQuery = 'INSERT INTO users (username, password) VALUES (?, ?)';
  connection.query(signupQuery, [username, password], (err, result) => {
    if (err) {
      console.error('Error creating user:', err);
      res.send('An error occurred while creating the user');
      return;
    }

    req.session.username = username; // Store username in session
    res.redirect('/dashboard');
  });
});

app.get('/dashboard', (req, res) => {
  const username = req.session.username;

  if (!username) {
    res.redirect('/');
    return;
  }

  const getPropertiesQuery = `
    SELECT * FROM properties
    WHERE user_id = (
      SELECT id FROM users WHERE username = ?
    )
  `;
  connection.query(getPropertiesQuery, [username], (err, results) => {
    if (err) {
      console.error('Error retrieving user properties:', err);
      res.send('An error occurred while retrieving user properties');
      return;
    }

    const properties = results;
    res.render('dashboard', { username, properties });
  });
});

app.get('/search/:username', (req, res) => {
  const { username } = req.params;

  const searchQuery = `
    SELECT * FROM properties
    WHERE user_id = (
      SELECT id FROM users WHERE username = ?
    )
  `;
  connection.query(searchQuery, [username], (err, results) => {
    if (err) {
      console.error('Error searching properties:', err);
      res.send('An error occurred while searching properties');
      return;
    }

    const properties = results;
    res.render('dashboard', { username: `Properties by ${username}`, properties });
  });
});

app.get('/property-form', (req, res) => {
  const username = req.session.username;

  if (!username) {
    res.redirect('/');
    return;
  }

  res.render('propertyForm', { username });
});

app.post('/property-form', (req, res) => {
  const username = req.session.username;

  if (!username) {
    res.redirect('/');
    return;
  }

  // Retrieve form data
  const { propertyType, propertyValue, propertySize, propertyHeight, propertyRating, propertyDescription, contact, name, age, aadharCardNumber, panCardNumber, propertyLocation } = req.body;

  // Insert property into the properties table
  const insertPropertyQuery = `
    INSERT INTO properties (property_type, property_value, property_size, property_height, property_rating, property_description, contact, name, age, aadhar_card_number, pan_card_number, property_location, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, (SELECT id FROM users WHERE username = ?))
  `;
  connection.query(insertPropertyQuery, [propertyType, propertyValue, propertySize, propertyHeight, propertyRating, propertyDescription, contact, name, age, aadharCardNumber, panCardNumber, propertyLocation, username], (err, result) => {
    if (err) {
      console.error('Error inserting property:', err);
      res.send('An error occurred while inserting the property');
      return;
    }

    res.redirect('/dashboard');
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
