// server.js
const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const cors = require('cors');
const app = express();

// Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'saprem',
  database: 'project_management_db'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to database');
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));


//root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Helper function to execute SQL queries
function query(sql, args) {
  return new Promise((resolve, reject) => {
    db.query(sql, args, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// Routes
app.post('/api/register', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, role]);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error registering user' });
  }
});

// Login Route
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const users = await query('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) {
      return res.status(400).json({ error: 'User not found' });
    }
    const user = users[0];
    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, 'your_jwt_secret');
      res.json({ token });
    } else {
      res.status(400).json({ error: 'Invalid password' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error logging in' });
  }
});


//projects api fetch / route
app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    const projects = await query('SELECT * FROM projects');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching projects' });
  }
});

// projects  api get route
app.post('/api/projects', authenticateToken, async (req, res) => {
  const { name, description } = req.body;
  try {
    const result = await query('INSERT INTO projects (name, description) VALUES (?, ?)', [name, description]);
    res.status(201).json({ id: result.insertId, name, description });
  } catch (error) {
    res.status(500).json({ error: 'Error creating project' });
  }
});

//tasks fetch
app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const tasks = await query('SELECT * FROM tasks');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching tasks' });
  }
});


//tasks create
app.post('/api/tasks', authenticateToken, async (req, res) => {
  const { project_id, title, description, assigned_to, status } = req.body;
  try {
    const result = await query('INSERT INTO tasks (project_id, title, description, assigned_to, status) VALUES (?, ?, ?, ?, ?)', 
      [project_id, title, description, assigned_to, status]);
    res.status(201).json({ id: result.insertId, project_id, title, description, assigned_to, status });
  } catch (error) {
    res.status(500).json({ error: 'Error creating task' });
  }
});

//auth
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, 'your_jwt_secret', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));