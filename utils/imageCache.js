const fs = require('fs');
const path = require('path');
const ogs = require('open-graph-scraper');
const axios = require('axios');

makePath = (originalImageUrl, filename = null) => {

    var ext;

    // If we passed in a filename, get the extension from that (since airtable URLs don't have the extension)
    if (filename != null){
      ext = "." + filename.split('.').pop();
    }else{
      ext = path.extname(new URL(originalImageUrl).pathname);
    }

    const imageName = `image${Date.now()}${ext}`;
    const imagePath = path.resolve(__dirname, '../cache', imageName);
    return imagePath;

}


exports.downloadImage = async (url, filename = null) => {
    
    console.log("Downloading an image to the cache", url, filename);

    const path = makePath(url, filename);
    
    const writer = fs.createWriteStream(path);
  
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    });
  
    response.data.pipe(writer);
  
    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(path));
      writer.on('error', reject);
    });

  };