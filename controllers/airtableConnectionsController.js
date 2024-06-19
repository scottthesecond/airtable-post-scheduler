const Airtable = require('airtable');
Airtable.configure({ apiKey: process.env.AIRTABLE_API_KEY });
const base = Airtable.base(process.env.AIRTABLE_BASE_ID);

exports.addOrUpdateConnectionToAirtable = async (connection) => {
  try {
    const records = await base(process.env.AIRTABLE_CONNECTIONS_TABLE).select({
      filterByFormula: `{Connection ID} = '${connection.id}'`
    }).firstPage();

    if (records.length > 0) {
      // Update existing record
      await base(process.env.AIRTABLE_CONNECTIONS_TABLE).update(records[0].id, {
        "Page Name": connection.page_name,
        "Platform": connection.platform,
      });
    } else {
      // Create new record
      await base(process.env.AIRTABLE_CONNECTIONS_TABLE).create([
        {
          fields: {
            "Page Name": connection.page_name,
            "Platform": connection.platform,
            "Connection ID": connection.id,
            "Authenticated": true
          }
        }
      ]);
    }
  } catch (err) {
    throw new Error(`Error adding/updating connection in Airtable: ${err.message}`);
  }
};