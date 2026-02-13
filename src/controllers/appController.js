const { query } = require('../config/database');

const getVersion = async (req, res) => {
  try {
    const result = await query('SELECT key, value FROM app_settings');
    
    // Convert rows to object
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });

    // Fallback defaults if DB is empty for some reason
    const response = {
      min_version: settings.min_version || '1.0.0',
      latest_version: settings.latest_version || '1.0.0',
      store_url_android: settings.store_url_android || '',
      store_url_ios: settings.store_url_ios || '',
      force_update: settings.force_update === 'true',
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching version config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getVersion,
};
