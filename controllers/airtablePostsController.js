const Airtable = require('airtable');
Airtable.configure({ apiKey: process.env.AIRTABLE_API_KEY });
const base = Airtable.base(process.env.AIRTABLE_BASE_ID);

exports.fetchScheduledPosts = async () => {
  try {
    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
    const posts = await base(process.env.AIRTABLE_POSTS_TABLE).select({
      filterByFormula: `AND(IS_AFTER({Post At}, DATETIME_PARSE('${fifteenMinutesAgo.toISOString()}')), IS_BEFORE({Post At}, DATETIME_PARSE('${now.toISOString()}')), {Error} = '', {Post Link} = '', {Post Automatically (ScottBott)}=TRUE())`,
    }).firstPage();

    console.log(`Fetched ${posts.length} scheduled posts from Airtable`);
    return posts;
  } catch (err) {
    console.error('Error fetching scheduled posts from Airtable:', err.message);
    return [];
  }
};

exports.updatePostStatus = async (postId, postLink, error) => {
  try {
    const fields = {};
    if (postLink) {
      fields['Post Link'] = postLink;
    }
    if (error) {
      fields['Error'] = error;
    }

    console.log(`Updating post ${postId} with ${JSON.stringify(fields)}`);
    await base(process.env.AIRTABLE_POSTS_TABLE).update(postId,  fields );
  } catch (err) {
    console.error('Error updating post status in Airtable:', err.message);
  }
};