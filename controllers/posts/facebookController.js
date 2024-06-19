const axios = require('axios');

exports.post = async (post, accessToken) => {
  const postTypeArray = post['Type'];
  const postType = Array.isArray(postTypeArray) ? postTypeArray[0] : postTypeArray; // Ensure postType is a string
  const copy = post.Copy;
  let postUrl = '';

  try {
    let response;
    if (postType === 'Text') {
      response = await axios.post(`https://graph.facebook.com/v20.0/me/feed`, {
        message: copy,
        access_token: accessToken,
      });
    } else if (postType === 'Link') {
      const linkArray = post.URL;
      const link = Array.isArray(linkArray) ? linkArray[0] : linkArray; // Ensure link is a string
      response = await axios.post(`https://graph.facebook.com/v20.0/me/feed`, {
        message: copy,
        link: link,
        access_token: accessToken,
      });
    } else if (postType === 'Image') {
      const imageArray = post.Image;
      const imageUrl = Array.isArray(imageArray) ? imageArray[0].url : imageArray.url; // Ensure imageUrl is a string
      response = await axios.post(`https://graph.facebook.com/v20.0/me/photos`, {
        url: imageUrl,
        caption: copy,
        access_token: accessToken,
      });
    }

    if (response && response.data) {
      console.log('Facebook API response:', response.data);
      if (response.data.id) {
        postUrl = `https://www.facebook.com/${response.data.id}`;
      } else if (response.data.post_id) {
        postUrl = `https://www.facebook.com/${response.data.post_id}`;
      }
      console.log(`Facebook post successful: ${postUrl}`);
      return postUrl;
    } else {
      throw new Error('Facebook API response is undefined or missing data');
    }
  } catch (err) {
    if (err.response) {
      console.error('Error posting to Facebook:', err.response.data);
    } else {
      console.error('Error posting to Facebook:', err.message);
    }
    throw err;
  }
};