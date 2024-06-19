const db = require('../config/database');

exports.insertConnection = (login_id, page_id, page_name, platform, access_token, callback) => {
  db.run(
    `INSERT INTO connections (login_id, page_id, page_name, platform, access_token) VALUES (?, ?, ?, ?, ?)`,
    [login_id, page_id, page_name, platform, access_token],
    function (err) {
      callback(err);
    }
  );
};

exports.updateConnection = (login_id, page_id, page_name, platform, access_token, callback) => {
  db.run(
    `UPDATE connections SET page_name = ?, access_token = ?, updated_at = CURRENT_TIMESTAMP WHERE login_id = ? AND page_id = ? AND platform = ?`,
    [page_name, access_token, login_id, page_id, platform],
    function (err) {
      callback(err);
    }
  );
};

exports.findConnection = (login_id, page_id, platform, callback) => {
  db.get(
    `SELECT id FROM connections WHERE login_id = ? AND page_id = ? AND platform = ?`,
    [login_id, page_id, platform],
    (err, row) => {
      callback(err, row);
    }
  );
};

exports.insertConnections = (connections, callback) => {
  const placeholders = connections.map(() => '(?, ?, ?, ?, ?)').join(',');
  const values = connections.flatMap(Object.values);

  db.run(
    `INSERT INTO connections (login_id, page_id, page_name, platform, access_token) VALUES ${placeholders}`,
    values,
    function (err) {
      callback(err);
    }
  );
};