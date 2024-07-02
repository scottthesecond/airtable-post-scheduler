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
    scope: 'r_organization_social w_organization_social w_member_social r_basicprofile rw_organization_admin',
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

    // Fetch user profile
    const userResponse = await axios.get('https://api.linkedin.com/v2/me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    const user_id = userResponse.data.id;

    // Save login information to the database
    loginModel.insertLogin('LinkedIn', access_token, null, expires_in, user_id, (err, login_id) => {
      if (err) {
        console.error('Error storing login:', err.message);
        return res.status(500).send('Internal Server Error');
      }
      fetchOrganizations(access_token, login_id, res);
    });
  } catch (error) {
    if (error.response) {
      console.error('Error exchanging code for token:', error.response.data);
    } else {
      console.error('Error exchanging code for token:', error.message);
    }
    res.status(500).send('Internal Server Error');
  }
};

async function fetchOrganizations(accessToken, login_id, res) {
  try {
    const orgResponse = await axios.get('https://api.linkedin.com/v2/organizationAcls?q=roleAssignee', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Linkedin-Version': '202404'
      },
    });

    console.log('Organizations response:', orgResponse.data);

    // Extract organization IDs from URNs
    const organizationIds = orgResponse.data.elements.map(org => org.organization.split(':').pop());

    // Fetch organization details
    const organizations = await Promise.all(organizationIds.map(async (id) => {
      const orgDetailsResponse = await axios.get(`https://api.linkedin.com/rest/organizations/${id}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Linkedin-Version': '202404'
        }
      });

      const organization = orgDetailsResponse.data;
      return {
        id: organization.id,
        name: organization.localizedName,
        platform: 'LinkedIn',
        access_token: accessToken,
      };
    }));

    console.log('Fetched organizations:', organizations);

    handleConnections(login_id, organizations, res);
  } catch (error) {
    console.error('Error fetching organizations:', error.response ? error.response.data : error.message);
    res.status(500).send('Error fetching organizations');
  }
}  
  
function handleConnections(login_id, organizations, res) {
  organizations.forEach(org => {
    console.log('Handling organization:', org);

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
        console.log('Updating existing connection:', connectionData);
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
        console.log('Inserting new connection:', connectionData);
        connectionModel.insertConnection(login_id, org.id, org.name, org.platform, org.access_token, (err, connection_id) => {
          if (err) {
            console.error('Error storing connection:', err.message);
            return res.status(500).send('Internal Server Error');
          }

          console.log("New COnnection ID", connection_id);
          
          connectionData.id = connection_id; // Update the connectionData with the new connection_id

          console.log('Inserting Data to Airtable:', connectionData);

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
    organizations,
  });
}