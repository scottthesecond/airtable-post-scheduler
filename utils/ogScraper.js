const fs = require('fs');
const ogs = require('open-graph-scraper');
const imageCache = require('./imageCache');

exports.getOgData = async (link) => {

      const { result } = await ogs({ url: link });
      //console.log('OG Data:', result);

      const ogTitle = result.ogTitle || copy;
      const ogDescription = result.ogDescription || '';
      const ogImage = result.ogImage ? result.ogImage[0].url : '';

      const imagePath = await imageCache.downloadImage(ogImage);

      //const image = fs.readFileSync(imagePath);

      return { ogTitle, ogDescription, ogImage, imagePath}

};