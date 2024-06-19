const querystring = require('querystring');
const axios = require('axios');
const loginModel = require('../../models/loginModel');
const connectionModel = require('../../models/connectionModel');
const airtableConnectionsController = require('../airtableConnectionsController');

exports.authMeta = (req, res) => {
  const authUrl = 'https://www.facebook.com/v20.0/dialog/oauth';
  const queryParams = querystring.stringify({
    client_id: process.env.META_APP_ID,
    redirect_uri: `${process.env.REDIRECT_URI}/meta`,
    scope: 'pages_manage_posts,pages_read_engagement,pages_show_list',
    response_type: 'code',
  });

  res.redirect(`${authUrl}?${queryParams}`);
};

exports.metaCallback = async (req, res) => {
  const code = req.query.code;
  const tokenUrl = 'https://graph.facebook.com/v20.0/oauth/access_token';
  const params = {
    client_id: process.env.META_APP_ID,
    client_secret: process.env.META_APP_SECRET,
    redirect_uri: `${process.env.REDIRECT_URI}/meta`,
    code,
  };

  try {
    const response = await axios.get(tokenUrl, { params });
    const { access_token, expires_in } = response.data;

    // Fetch user ID
    const userResponse = await axios.get('https://graph.facebook.com/v20.0/me', {
      params: {
        access_token: access_token,
      },
    });
    const user_id = userResponse.data.id;

    // Check if login exists
    loginModel.findLogin('Meta', user_id, (err, login) => {
      if (err) {
        console.error('Error finding login:', err.message);
        return res.status(500).send('Internal Server Error');
      }

      if (login) {
        // Update existing login
        loginModel.updateLogin('Meta', access_token, null, expires_in, user_id, (err) => {
          if (err) {
            console.error('Error updating login:', err.message);
            return res.status(500).send('Internal Server Error');
          }
          handleConnections(login.id, access_token, res);
        });
      } else {
        // Insert new login
        loginModel.insertLogin('Meta', access_token, null, expires_in, user_id, (err, login_id) => {
          if (err) {
            console.error('Error storing login:', err.message);
            return res.status(500).send('Internal Server Error');
          }
          handleConnections(login_id, access_token, res);
        });
      }
    });
  } catch (error) {
    console.error('Error exchanging code for token:', error.message);
    res.status(500).send('Internal Server Error');
  }
};

async function fetchPages(accessToken) {
  const response = await axios.get('https://graph.facebook.com/v20.0/me/accounts', {
    params: {
      access_token: accessToken,
    },
  });

  const pages = response.data.data.map(page => ({
    id: page.id,
    name: page.name,
    platform: 'Facebook',
    access_token: page.access_token,
  }));

  const instagramBusinessAccounts = [];

  for (const page of pages) {
    if (page.access_token) {
      const igResponse = await axios.get(`https://graph.facebook.com/v20.0/${page.id}?fields=instagram_business_account`, {
        params: {
          access_token: page.access_token,
        },
      });
      if (igResponse.data.instagram_business_account) {
        instagramBusinessAccounts.push({
          id: igResponse.data.instagram_business_account.id,
          name: page.name,
          platform: 'Instagram',
          access_token: page.access_token,
        });
      }
    }
  }

  return [...pages, ...instagramBusinessAccounts];
}

function handleConnections(login_id, access_token, res) {
  fetchPages(access_token)
    .then(pages => {
      pages.forEach(page => {
        connectionModel.findConnection(login_id, page.id, page.platform, (err, connection) => {
          if (err) {
            console.error('Error finding connection:', err.message);
            return res.status(500).send('Internal Server Error');
          }

          const connectionData = {
            id: connection ? connection.id : null,
            login_id,
            page_id: page.id,
            page_name: page.name,
            platform: page.platform,
            access_token: page.access_token,
          };

          if (connection) {
            // Update existing connection
            connectionModel.updateConnection(login_id, page.id, page.name, page.platform, page.access_token, (err) => {
              if (err) {
                console.error('Error updating connection:', err.message);
                return res.status(500).send('Internal Server Error');
              }
              airtableConnectionsController.addOrUpdateConnectionToAirtable(connectionData)
                .then(() => {
                  console.log('Connection updated in Airtable');
                })
                .catch(err => {
                  console.error('Error updating connection in Airtable:', err.message);
                });
            });
          } else {
            // Insert new connection
            connectionModel.insertConnection(login_id, page.id, page.name, page.platform, page.access_token, (err, connection_id) => {
              if (err) {
                console.error('Error storing connection:', err.message);
                return res.status(500).send('Internal Server Error');
              }
              connectionData.id = connection_id;
              airtableConnectionsController.addOrUpdateConnectionToAirtable(connectionData)
                .then(() => {
                  console.log('Connection added to Airtable');
                })
                .catch(err => {
                  console.error('Error adding connection to Airtable:', err.message);
                });
            });
          }
        });
      });

      res.json({
        message: 'Meta authentication successful',
        pages,
      });
    })
    .catch(error => {
      console.error('Error fetching pages:', error.message);
      res.status(500).send('Error fetching pages');
    });
}