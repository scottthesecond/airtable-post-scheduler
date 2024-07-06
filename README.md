# SocialTable
Skip HootSutie or Buffer.  You're already paying for Airtable – use it as your social media scheduler!

## How it Works
1. Sign in to your social media accounts
   Keys are stored in a SQLite database, and records are added to airtable for each account you've signed in for.

2. Schedule posts in Airtable
   Write your content in Airtable, and select the social account as a Linked Record.

3. Social Table handles the rest.

# Usage
## Configuration
### Environment Variables
Configuration should be stored in a `.env` file.

| Parameter | Description | Required |
| --- | --- | --- |
| PORT | Port the application listens on (for auth & webhooks) | Required |
| AIRTABLE_API_KEY | Airtable Personal Access Token or Key | Required |
| AIRTABLE_BASE_ID | ID of the base storing your posts and connections | Required |
| AIRTABLE_CONNECTIONS_TABLE | Name of the table holding your accounts | Required |
| META_APP_ID | APP ID for your [Meta App](https://developers.facebook.com/apps) | Required for posting to Facebook or Instagram |
| META_APP_SECRET | Secret Key for your [Meta App](https://developers.facebook.com/apps) | Required for posting to Facebook or Instagram |
| LINKEDIN_CLIENT_ID | APP ID for your [Linkedin App](https://developers.facebook.com/apps) | Required for posting to LinkedIn |
| LINKEDIN_CLIENT_SECRET | Secret Key for your [Linkedin App](https://developers.facebook.com/apps) | Required for posting to LinkedIn |

### Airtable Configuration
*Todo...*

## Social Media Authentication
Sign into your social media accounts using these urls:
- {Appurl}/auth/linkedin
- {appurl}/auth/meta

Once you've signed in to your accounts, the OAuth tokens will be stored locally in a sqlite database.  A record will be created in Airtable to represent that page/account, but the tokens themselves will not be stored in Airtable. 

# Todo
- [ ] Encrypt tokens sotred in sqlite
- [ ] Create guides for setting up:
    - [ ] General usage guide about .env stuff
    - [ ] Meta App
    - [ ] LinkedIn App
- [ ] Dockerize
- [ ] Move to typescript because this is a freakin' mess
- [X] Meta Login
- [X] Meta Posting
- [X] Linkedin Login
- [X] Linkedin Posting
- [ ] Instagram Posting
- [ ] Video Support
   - [ ] LinkedIn
   - [ ] Facebook
   - [ ] Instagram