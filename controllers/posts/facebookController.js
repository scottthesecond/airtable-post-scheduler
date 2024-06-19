const axios = require('axios');

exports.post = async (post, accessToken) => {
  const url = post.URL;
  const copy = post.Copy;

  try {
    await axios.post(`https://graph.facebook.com/v20.0/me/feed`, {
      message: copy,
      link: url,
      access_token: accessToken,
    });
    console.log('Post successfully made to Facebook');
  } catch (err) {
    console.error('Error posting to Facebook:', err.message);
  }
};