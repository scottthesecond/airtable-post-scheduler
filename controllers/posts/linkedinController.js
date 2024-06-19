const axios = require('axios');

exports.post = async (post, accessToken) => {
  const postTypeArray = post['Type'];
  const postType = Array.isArray(postTypeArray) ? postTypeArray[0] : postTypeArray; // Ensure postType is a string
  const copy = post.Copy;
  let postUrl = '';

  try {
    if (postType === 'Text') {
      throw new Error('LinkedIn does not support text-only posts');
    } else if (postType === 'Link') {
      const linkArray = post.URL;
      const link = Array.isArray(linkArray) ? linkArray[0] : linkArray; // Ensure link is a string
      const response = await axios.post(`https://api.linkedin.com/v2/shares`, {
        content: {
          contentEntities: [{
            entityLocation: link,
          }],
          title: copy,
        },
        distribution: {
          linkedInDistributionTarget: {}
        },
        owner: `urn:li:organization:${post['Connection ID']}`,
        text: {
          text: copy
        }
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });
      postUrl = `https://www.linkedin.com/feed/update/${response.data.id}`;
    } else if (postType === 'Image') {
      const imageArray = post.Image;
      const imageUrl = Array.isArray(imageArray) ? imageArray[0].url : imageArray.url; // Ensure imageUrl is a string
      const uploadResponse = await axios.post(`https://api.linkedin.com/v2/assets?action=registerUpload`, {
        registerUploadRequest: {
          owner: `urn:li:organization:${post['Connection ID']}`,
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          serviceRelationships: [{
            identifier: 'urn:li:userGeneratedContent',
            relationshipType: 'OWNER'
          }]
        }
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });

      const uploadUrl = uploadResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;

      await axios.put(uploadUrl, imageUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/octet-stream'
        }
      });

      const asset = uploadResponse.data.value.asset;
      const response = await axios.post(`https://api.linkedin.com/v2/shares`, {
        content: {
          contentEntities: [{
            entityLocation: imageUrl,
            entity: asset,
          }],
          title: copy,
        },
        distribution: {
          linkedInDistributionTarget: {}
        },
        owner: `urn:li:organization:${post['Connection ID']}`,
        text: {
          text: copy
        }
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });
      postUrl = `https://www.linkedin.com/feed/update/${response.data.id}`;
    }
    console.log('LinkedIn API response:', response.data);
    console.log(`LinkedIn post successful: ${postUrl}`);
    return postUrl;
  } catch (err) {
    if (err.response) {
      console.error('Error posting to LinkedIn:', err.response.data);
    } else {
      console.error('Error posting to LinkedIn:', err.message);
    }
    throw err;
  }
};