const fs = require('fs');
const path = require('path');
const ogs = require('open-graph-scraper');
const axios = require('axios');

makePath = async (originalImageUrl) => {
    // Extract the image extension
    const ext = path.extname(new URL(originalImageUrl).pathname);
    const imageName = `image${Date.now()}${ext}`;
    const imagePath = path.resolve(__dirname, '../cache', imageName);
    return imagePath;
}


exports.downloadImage = async (url) => {
    
    const path = makePath(url);
    
    const writer = fs.createWriteStream(path);
  
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    });
  
    response.data.pipe(writer);
  
    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  };