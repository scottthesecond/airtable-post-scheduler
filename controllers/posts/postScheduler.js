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

const processPost = async (postRecord) => {
  const post = postRecord.fields;
  const connectionId = parseInt(post['Connection ID'], 10);
  console.log(`Processing post for Connection ID: ${connectionId}`);

  await new Promise((resolve) => {
    db.get(
      `SELECT * FROM connections WHERE id = ?`,
      [connectionId],
      async (err, connection) => {
        if (err) {
          console.error('Error fetching connection from database:', err.message);
          resolve();
          return;
        }

        if (connection) {
          console.log(`Connection found: ${JSON.stringify(connection)}`);
          await postToPlatform(connection, post, postRecord.id);
        } else {
          console.error(`No connection found for Connection ID: ${connectionId}`);
        }
        resolve();
      }
    );
  });
};

const processScheduledPosts = async (isAsync = false) => {
  const posts = await airtablePostsController.fetchScheduledPosts();
  console.log(`Fetched ${posts.length} posts`);

  if (isAsync) {
    // Process posts asynchronously
    posts.forEach(async (postRecord) => {
      await processPost(postRecord);
    });
  } else {
    // Process posts synchronously
    for (const postRecord of posts) {
      await processPost(postRecord);
    }
  }
};

// Schedule the job to run every minute
schedule.scheduleJob('* * * * *', () => {
  processScheduledPosts(/* true or false based on your preference */);
});

// Run the job immediately on application start
processScheduledPosts(/* true or false based on your preference */);

module.exports = {
  processScheduledPosts,
};