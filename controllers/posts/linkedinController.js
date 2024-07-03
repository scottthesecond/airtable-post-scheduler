const axios = require('axios');
const ogs = require('open-graph-scraper');
const fs = require('fs');
const path = require('path');
const ogScraper = require('../../utils/ogScraper');
const imageCache = require('../../utils/imageCache');


/**
 * Uploads an image to LinkedIn to be used in a post.
 * @param {string} accessToken Linkedin access token.
 * @param {object} connection Object with LinkedIn connection data – eventually accessToken will be moved in here.
 * @param {string} imagePath Path to the image to upload.
 * @returns { imageUrn }
 */

uploadImage = async(accessToken, connection, imagePath) => {
  
  // Initilizes the upload request with Linkedin, and get the URL to post the image to.
  const uploadRequest = await axios.post(`https://api.linkedin.com/rest/images?action=initializeUpload`, {
    initializeUploadRequest: {
      "owner": `urn:li:organization:${connection['page_id']}` 
    }
  }, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': '202406'
      }
  });

  console.log('Upload Request Response:', uploadRequest.data);

  const imageFs = fs.readFileSync(imagePath);

  // Upload the image to the URL provided
  const uploadUrl = uploadRequest.data.value.uploadUrl;
  const imageUploadResponse = await axios.put(uploadUrl, imageFs, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/octet-stream',
      'X-Restli-Protocol-Version': '2.0.0',
      'LinkedIn-Version': '202406',
    }
  });

  console.log('Image Upload Response:', imageUploadResponse.status, imageUploadResponse.statusText, uploadRequest.data);

  const imageUrn = uploadRequest.data.value.image;
  return { imageUrn };

}

exports.post = async (post, accessToken, connection) => {

  const postTypeArray = post['Type'];
  const postType = Array.isArray(postTypeArray) ? postTypeArray[0] : postTypeArray; // Ensure postType is a string
  const copy = post.Copy;
  let postUrl = '';

  try {
    let response;

    if (postType === 'Link') {

      console.log("Posting an article", post);

      const linkArray = post.URL;
      const link = Array.isArray(linkArray) ? linkArray[0] : linkArray; // Ensure link is a string

     const { ogTitle, ogDescription, imagePath} = await ogScraper.getOgData(link);

     const { imageUrn } = await uploadImage(accessToken, connection, imagePath);

      const payload = {
        author: `urn:li:organization:${connection['page_id']}`,
        lifecycleState: "PUBLISHED",
        commentary: copy,
        visibility: "PUBLIC",
        distribution: {
          feedDistribution: "MAIN_FEED",
          targetEntities: [],
          thirdPartyDistributionChannels: []
        },
        content: {
          article: {
            title: ogTitle,
            description: ogDescription,
            source: link,
            thumbnail: imageUrn
          }
        },
        isReshareDisabledByAuthor: false
      };

      console.log('Payload:', JSON.stringify(payload, null, 2));

      response = await axios.post(`https://api.linkedin.com/rest/posts`, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': '202406',
          'Content-Type': 'application/json'
        }
      });

      console.log('LinkedIn Post Response:', response.data);

      const postId = response.headers['x-restli-id'];
      postUrl = `https://www.linkedin.com/feed/update/${postId}`;

    } else if (postType === 'Image') {

      console.log("Posting an Image", post);


      const airtableImage = Array.isArray(post.Image) ? post.Image[0] : post.Image; 

      console.log(airtableImage);

      const imagePath = await imageCache.downloadImage(airtableImage.url, airtableImage.filename);
      
      const { imageUrn } = await uploadImage(accessToken, connection, imagePath);

      console.log("imageUrn:", imageUrn)

      const payload = {
        author: `urn:li:organization:${connection['page_id']}`,
        lifecycleState: "PUBLISHED",
        commentary: copy,
        visibility: "PUBLIC",
        distribution: {
          feedDistribution: "MAIN_FEED",
          targetEntities: [],
          thirdPartyDistributionChannels: []
        },
        content: {
          media: {
            id: imageUrn
          }
        },
        isReshareDisabledByAuthor: false
      };

      console.log('Payload:', JSON.stringify(payload, null, 2));

      response = await axios.post(`https://api.linkedin.com/rest/posts`, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': '202406',
          'Content-Type': 'application/json'
        }
      });

      console.log('LinkedIn Post Response:', response.data);

      const postId = response.headers['x-restli-id'];
      postUrl = `https://www.linkedin.com/feed/update/${postId}`;

    } else if (postType === 'Text') {
      const payload = {
        author: `urn:li:organization:${connection['page_id']}`,
        lifecycleState: "PUBLISHED",
        commentary: copy,
        visibility: "PUBLIC",
        distribution: {
          feedDistribution: "MAIN_FEED",
          targetEntities: [],
          thirdPartyDistributionChannels: []
        },
        isReshareDisabledByAuthor: false
      };

      console.log('Payload:', JSON.stringify(payload, null, 2));

      response = await axios.post(`https://api.linkedin.com/rest/posts`, payload, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
          'LinkedIn-Version': '202406',
          'Content-Type': 'application/json'
        }
      });

      console.log('LinkedIn Post Response:', response.data);

      const postId = response.headers['x-restli-id'];
      postUrl = `https://www.linkedin.com/feed/update/${postId}`;
    }

    console.log('LinkedIn API response:', response.data);
    console.log(`LinkedIn post successful: ${postUrl}`);
    return postUrl;
  } catch (err) {
    if (err.response) {
      console.error('Error posting to LinkedIn:', {
        status: err.response.status,
        headers: err.response.headers,
        data: err.response.data,
      });
      // Log detailed error information
      if (err.response.data && err.response.data.errorDetails) {
        console.error('LinkedIn Error Details:', JSON.stringify(err.response.data.errorDetails, null, 2));
      }
        } else {
      console.error('Error posting to LinkedIn:', err);
    }
    throw err;
  }
};