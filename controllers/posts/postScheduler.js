const Airtable = require('airtable');
const schedule = require('node-schedule');
const db = require('../../config/database');
const airtablePostsController = require('../airtablePostsController');
const facebookController = require('./facebookController');
const instagramController = require('./instagramController');

Airtable.configure({ apiKey: process.env.AIRTABLE_API_KEY });
const base = Airtable.base(process.env.AIRTABLE_BASE_ID);

const postToPlatform = async (connection, post) => {
  try {
    if (connection.platform === 'Facebook') {
      await facebookController.post(post, connection.access_token);
    } else if (connection.platform === 'Instagram') {
      await instagramController.post(post, connection.access_token);
    }
    // Add other platforms here
  } catch (err) {
    console.error(`Error posting to ${connection.platform}:`, err.message);
  }
};

const processScheduledPosts = async () => {
  const posts = await airtablePostsController.fetchScheduledPosts();

  posts.forEach(async (postRecord) => {
    const post = postRecord.fields;
    const connectionId = post['Connection ID'];

    db.get(
      `SELECT * FROM connections WHERE id = ?`,
      [connectionId],
      async (err, connection) => {
        if (err) {
          console.error('Error fetching connection from database:', err.message);
          return;
        }

        if (connection) {
          await postToPlatform(connection, post);
        } else {
          console.error(`No connection found for Connection ID: ${connectionId}`);
        }
      }
    );
  });
};

// Schedule the job to run every minute
schedule.scheduleJob('* * * * *', () => {
  processScheduledPosts();
});

module.exports = {
  processScheduledPosts,
};