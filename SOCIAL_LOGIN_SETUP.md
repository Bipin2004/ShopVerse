# Social Login Setup

This document explains how to finalize the social login setup for your ShopVerse application.

## Prerequisites

To make social login work, you need to:

1. Register your application with Google and Facebook developer platforms
2. Update your environment variables with the correct credentials

## Google OAuth Setup

1. Go to [Google Developer Console](https://console.developers.google.com/)
2. Create a new project
3. Go to "Credentials" and set up an OAuth 2.0 Client ID
4. Add the following authorized redirect URI:
   - `http://localhost:3000/users/auth/google/callback` (for development)
   - Add your production URL when deploying
5. Copy the Client ID and Client Secret

## Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure the Valid OAuth Redirect URIs:
   - `http://localhost:3000/users/auth/facebook/callback` (for development)
   - Add your production URL when deploying
5. Copy the App ID and App Secret

## Update Environment Variables

Update your `.env` file with the real credentials:

```
# Google OAuth
GOOGLE_CLIENT_ID=your_actual_google_client_id
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret

# Facebook OAuth
FACEBOOK_APP_ID=your_actual_facebook_app_id
FACEBOOK_APP_SECRET=your_actual_facebook_app_secret
```

## Usage

The social login buttons are now functional. When clicked:

1. Users will be redirected to the respective authentication provider
2. After authentication, they'll be redirected back to your site
3. If it's a new user, an account will be created automatically
4. The user will be logged in and redirected to their profile page

## Security Notes

- OAuth users get a randomly generated password that they won't need to use
- To enhance security, consider implementing multi-factor authentication
- Keep your OAuth secret keys secure and never commit them to your repository
