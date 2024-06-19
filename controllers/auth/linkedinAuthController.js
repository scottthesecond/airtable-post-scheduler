const querystring = require('querystring');
const axios = require('axios');
const loginModel = require('../../models/loginModel');
const connectionModel = require('../../models/connectionModel');
const airtableConnectionsController = require('../airtableConnectionsController');

exports.authLinkedIn = (req, res) => {
  const authUrl = 'https://www.linkedin.com/oauth/v2/authorization';
  const queryParams = querystring.stringify({
    response_type: 'code',
    client_id: process.env.LINKEDIN_CLIENT_ID,
    redirect_uri: `${process.env.REDIRECT_URI}/linkedin`,
    scope: 'r_organization_social,w_organization_social,w_member_social',
  });

  res.redirect(`${authUrl}?${queryParams}`);
};

exports.linkedinCallback = async (req, res) => {
  const code = req.query.code;
  const tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
  const params = {
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: `${process.env.REDIRECT_URI}/linkedin`,
    client_id: process.env.LINKEDIN_CLIENT_ID,
    client_secret: process.env.LINKEDIN_CLIENT_SECRET,
  };

  try {
    const response = await axios.post(tokenUrl, querystring.stringify(params), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    const { access_token, expires_in } = response.data;

    // Fetch user ID
    const userResponse = await axios.get('https://api.linkedin.com/v2/me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const user_id = userResponse.data.id;

    // Check if login exists
    loginModel.findLogin('LinkedIn', user_id, (err, login) => {
      if (err) {
        console.error('Error finding login:', err.message);
        return res.status(500).send('Internal Server Error');
      }

      if (login) {
        // Update existing login
        loginModel.updateLogin('LinkedIn', access_token, null, expires_in, user_id, (err) => {
          if (err) {
            console.error('Error updating login:', err.message);
            return res.status(500).send('Internal Server Error');
          }
          handleConnections(login.id, access_token, res);
        });
      } else {
        // Insert new login
        loginModel.insertLogin('LinkedIn', access_token, null, expires_in, user_id, (err, login_id) => {
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

async function fetchOrganizations(accessToken) {
  const response = await axios.get('https://api.linkedin.com/v2/organizations', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return response.data.elements.map(org => ({
    id: org.id,
    name: org.localizedName,
    platform: 'LinkedIn',
    access_token: accessToken,
  }));
}

function handleConnections(login_id, access_token, res) {
  fetchOrganizations(access_token)
    .then(orgs => {
      orgs.forEach(org => {
        connectionModel.findConnection(login_id, org.id, org.platform, (err, connection) => {
          if (err) {
            console.error('Error finding connection:', err.message);
            return res.status(500).send('Internal Server Error');
          }

          const connectionData = {
            id: connection ? connection.id : null,
            login_id,
            page_id: org.id,
            page_name: org.name,
            platform: org.platform,
            access_token: org.access_token,
          };

          if (connection) {
            // Update existing connection
            connectionModel.updateConnection(login_id, org.id, org.name, org.platform, org.access_token, (err) => {
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
            connectionModel.insertConnection(login_id, org.id, org.name, org.platform, org.access_token, (err, connection_id) => {
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
        message: 'LinkedIn authentication successful',
        organizations: orgs,
      });
    })
    .catch(error => {
      console.error('Error fetching organizations:', error.message);
      res.status(500).send('Error fetching organizations');
    });
}