const axios = require('axios');
const { connect } = require('../../routes/metaRoutes');

exports.post = async (post, connection) => {
  const postTypeArray = post['Type'];
  const postType = Array.isArray(postTypeArray) ? postTypeArray[0] : postTypeArray; // Ensure postType is a string
  const copy = post.Copy;
  let postUrl = '';

  let token = connection.access_token;

  console.log("Post Image", post.Image);

  console.log("Token: ", token)

  try {
    if (postType === 'Text' && post.Image == null) {
      throw new Error('Instagram does not support text-only posts');
    } else if (postType === 'Link' && post.Image == null) {
      throw new Error('Instagram does not support link-only posts');
    } else if (postType === 'Image' || post.Image != null) {
      const imageArray = post.Image;
      const imageUrl = Array.isArray(imageArray) ? imageArray[0].url : imageArray.url; // Ensure imageUrl is a string
      const mediaResponse = await axios.post(`https://graph.facebook.com/v20.0/${connection.page_id}/media`, {
        image_url: imageUrl,
        caption: copy,
        access_token: token,
      });

      console.log(`Image Uploaded: ID: ${mediaResponse.data.id}`, mediaResponse.data)

      const publishResponse = await axios.post(`https://graph.facebook.com/v20.0/${connection.page_id}/media_publish`, {
        creation_id: mediaResponse.data.id,
        access_token: token,
      });

      postUrl = `https://www.instagram.com/p/${publishResponse.data.id}`;

      console.log('Instagram API response:', publishResponse.data);
      console.log(`Instagram post successful: ${postUrl}`);
  
    }
    return postUrl;
  } catch (err) {
    if (err.response) {
      console.error('Error posting to Instagram:', err.response.data);
    } else {
      console.error('Error posting to Instagram:', err.message);
    }
    throw err;
  }
};