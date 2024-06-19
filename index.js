const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const metaRoutes = require('./routes/metaRoutes');
const linkedinRoutes = require('./routes/linkedinRoutes');
const postScheduler = require('./controllers/posts/postScheduler');

const app = express();
const port = process.env.PORT || 3000;

app.use(metaRoutes);
app.use(linkedinRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to the Social Media Poster!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Start the post scheduler
postScheduler;