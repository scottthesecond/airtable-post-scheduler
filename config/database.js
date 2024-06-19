const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./auth.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
  }
});

// Create tables if they don't exist
db.run(`CREATE TABLE IF NOT EXISTS login (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT,
  access_token TEXT,
  refresh_token TEXT,
  expires_in INTEGER,
  user_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`);

db.run(`CREATE TABLE IF NOT EXISTS connections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  login_id INTEGER,
  page_id TEXT,
  page_name TEXT,
  platform TEXT,
  access_token TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (login_id) REFERENCES login(id)
)`);

module.exports = db;