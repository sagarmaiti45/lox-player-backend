const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../utils/jwt');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google Sign-In
const googleSignIn = async (req, res) => {
  try {
    const { id_token } = req.body;

    if (!id_token) {
      return res.status(400).json({ error: 'Google ID token is required' });
    }

    // Verify Google ID token
    const ticket = await client.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    // Extract user info from Google token
    const googleId = payload.sub;
    const email = payload.email;
    const fullName = payload.name;
    const avatarUrl = payload.picture;
    const emailVerified = payload.email_verified;

    if (!emailVerified) {
      return res.status(400).json({ error: 'Google email not verified' });
    }

    // Find or create user
    const user = await User.findOrCreateOAuthUser({
      email,
      fullName,
      avatarUrl,
      provider: 'google',
      providerId: googleId,
    });

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = await generateRefreshToken(user.id);

    res.json({
      session: {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          avatar_url: user.avatar_url,
          provider: user.provider,
          email_verified_at: user.email_verified_at,
          created_at: user.created_at,
        },
      },
    });
  } catch (error) {
    console.error('Google sign-in error:', error);

    if (error.message && error.message.includes('Token used too late')) {
      return res.status(401).json({ error: 'Google token expired. Please sign in again.' });
    }

    if (error.message && error.message.includes('Invalid token')) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    res.status(500).json({ error: 'Failed to authenticate with Google' });
  }
};

module.exports = {
  googleSignIn,
};
