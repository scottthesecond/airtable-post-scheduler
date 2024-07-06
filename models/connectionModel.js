const db = require('../config/database');

exports.findConnection = (login_id, page_id, platform, callback) => {
  db.get(
    `SELECT * FROM connections WHERE login_id = ? AND page_id = ? AND platform = ?`,
    [login_id, page_id, platform],
    (err, row) => {
      callback(err, row);
    }
  );
};

exports.insertConnection = (login_id, page_id, page_name, platform, access_token, callback) => {
  const stmt = db.prepare(
    `INSERT INTO connections (login_id, page_id, page_name, platform, access_token) VALUES (?, ?, ?, ?, ?)`
  );
  stmt.run(login_id, page_id, page_name, platform, access_token, function (err) {
    callback(err, this.lastID);
  });
};

exports.updateConnection = (login_id, page_id, page_name, platform, access_token, callback) => {
  const stmt = db.prepare(
    `UPDATE connections SET page_name = ?, access_token = ? WHERE login_id = ? AND page_id = ? AND platform = ?`
  );
  stmt.run(page_name, access_token, login_id, page_id, platform, (err) => {
    callback(err);
  });
};

exports.getConnectionById = (id, callback) => {
  db.get(`SELECT * FROM connections WHERE id = ?`, [id], (err, row) => {
    callback(err, row);
  });
};