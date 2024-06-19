const axios = require('axios');

exports.post = async (post, accessToken) => {
  const postTypeArray = post['Type'];
  const postType = Array.isArray(postTypeArray) ? postTypeArray[0] : postTypeArray; // Ensure postType is a string
  const copy = post.Copy;
  let postUrl = '';

  try {
    if (postType === 'Text') {
      throw new Error('Instagram does not support text-only posts');
    } else if (postType === 'Link') {
      throw new Error('Instagram does not support link-only posts');
    } else if (postType === 'Image') {
      const imageArray = post.Image;
      const imageUrl = Array.isArray(imageArray) ? imageArray[0].url : imageArray.url; // Ensure imageUrl is a string
      const mediaResponse = await axios.post(`https://graph.facebook.com/v20.0/me/media`, {
        image_url: imageUrl,
        caption: copy,
        access_token: accessToken,
      });
      const publishResponse = await axios.post(`https://graph.facebook.com/v20.0/me/media_publish`, {
        creation_id: mediaResponse.data.id,
        access_token: accessToken,
      });
      postUrl = `https://www.instagram.com/p/${publishResponse.data.id}`;
    }
    console.log('Instagram API response:', response.data);
    console.log(`Instagram post successful: ${postUrl}`);
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