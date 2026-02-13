const getVersion = (req, res) => {
  try {
    // In a real scenario, these values could come from a database
    // For now, we hardcode them as per requirements
    const versionConfig = {
      min_version: '1.0.0', // Change this to force update
      latest_version: '1.0.1',
      store_url_android: 'https://play.google.com/store/apps/details?id=com.loxplayer.app',
      store_url_ios: 'https://apps.apple.com/app/id123456789',
      force_update: false, // Optional flag for manual overrides
    };

    res.json(versionConfig);
  } catch (error) {
    console.error('Error fetching version config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getVersion,
};
