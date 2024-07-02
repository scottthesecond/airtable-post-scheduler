const Airtable = require('airtable');
const schedule = require('node-schedule');
const db = require('../../config/database');
const airtablePostsController = require('../airtablePostsController');
const facebookController = require('./facebookController');
const instagramController = require('./instagramController');
const linkedinController = require('./linkedinController');

Airtable.configure({ apiKey: process.env.AIRTABLE_API_KEY });
const base = Airtable.base(process.env.AIRTABLE_BASE_ID);

const postToPlatform = async (connection, post, postId) => {
  try {
    let postLink;
    if (connection.platform.toLowerCase() === 'facebook') {
      postLink = await facebookController.post(post, connection.access_token);
    } else if (connection.platform.toLowerCase() === 'instagram') {
      postLink = await instagramController.post(post, connection.access_token);
    } else if (connection.platform.toLowerCase() === 'linkedin') {
      postLink = await linkedinController.post(post, connection.access_token, connection);
    }
    // Add other platforms here

    console.log(`Post link: ${postLink}`);

    // Update Airtable with the post link
    await airtablePostsController.updatePostStatus(postId, postLink, null);
  } catch (err) {
    console.error(`Error posting to ${connection.platform}:`, err.message);
    // Update Airtable with the error message
    await airtablePostsController.updatePostStatus(postId, null, err.message);
  }
};

const processScheduledPosts = async () => {
  const posts = await airtablePostsController.fetchScheduledPosts();
  console.log(`Fetched ${posts.length} posts`);

  posts.forEach(async (postRecord) => {
    const post = postRecord.fields;
    const connectionId = parseInt(post['Connection ID'], 10);
    console.log(`Processing post for Connection ID: ${connectionId}`);

    db.get(
      `SELECT * FROM connections WHERE id = ?`,
      [connectionId],
      async (err, connection) => {
        if (err) {
          console.error('Error fetching connection from database:', err.message);
          return;
        }

        if (connection) {
          console.log(`Connection found: ${JSON.stringify(connection)}`);
          await postToPlatform(connection, post, postRecord.id);
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

// Run the job immediately on application start
processScheduledPosts();

module.exports = {
  processScheduledPosts,
};