const db = require('../config/database');

exports.insertLogin = (platform, access_token, refresh_token, expires_in, user_id, callback) => {
  db.run(
    `INSERT INTO login (platform, access_token, refresh_token, expires_in, user_id) VALUES (?, ?, ?, ?, ?)`,
    [platform, access_token, refresh_token, expires_in, user_id],
    function (err) {
      callback(err, this ? this.lastID : null);
    }
  );
};

exports.updateLogin = (platform, access_token, refresh_token, expires_in, user_id, callback) => {
  db.run(
    `UPDATE login SET access_token = ?, refresh_token = ?, expires_in = ?, updated_at = CURRENT_TIMESTAMP WHERE platform = ? AND user_id = ?`,
    [access_token, refresh_token, expires_in, platform, user_id],
    function (err) {
      callback(err);
    }
  );
};

exports.findLogin = (platform, user_id, callback) => {
  db.get(
    `SELECT id FROM login WHERE platform = ? AND user_id = ?`,
    [platform, user_id],
    (err, row) => {
      callback(err, row);
    }
  );
};