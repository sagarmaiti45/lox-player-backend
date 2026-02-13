const { query } = require('../config/database');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Admin login page
const loginPage = (req, res) => {
  if (req.session.adminId) {
    return res.redirect('/admin/dashboard');
  }
  res.render('admin/login', { error: null });
};

// Admin login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await query(
      'SELECT * FROM admin_users WHERE email = $1',
      [email]
    );

    const admin = result.rows[0];

    if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
      return res.render('admin/login', { error: 'Invalid email or password' });
    }

    // Update last login
    await query(
      'UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [admin.id]
    );

    req.session.adminId = admin.id;
    req.session.adminEmail = admin.email;
    req.session.adminName = admin.name;

    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Admin login error:', error);
    res.render('admin/login', { error: 'Login failed' });
  }
};

// Admin logout
const logout = (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
};

// Dashboard
const dashboard = async (req, res) => {
  try {
    // Get statistics
    const userCountResult = await query('SELECT COUNT(*) as count FROM users');
    const verifiedCountResult = await query('SELECT COUNT(*) as count FROM users WHERE email_verified_at IS NOT NULL');
    const filesCountResult = await query('SELECT COUNT(*) as count FROM files');
    const storageSizeResult = await query('SELECT COALESCE(SUM(file_size), 0) as total_size FROM files');

    const stats = {
      totalUsers: parseInt(userCountResult.rows[0].count),
      verifiedUsers: parseInt(verifiedCountResult.rows[0].count),
      totalFiles: parseInt(filesCountResult.rows[0].count),
      totalStorage: parseInt(storageSizeResult.rows[0].total_size),
    };

    // Get recent users
    const recentUsersResult = await query(`
      SELECT id, email, full_name, email_verified_at, created_at, last_login_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 10
    `);

    res.render('admin/dashboard', {
      adminName: req.session.adminName,
      stats,
      recentUsers: recentUsersResult.rows,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).send('Error loading dashboard');
  }
};

// Users list
const usersList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const offset = (page - 1) * limit;

    const users = await User.findAll(limit, offset);
    const totalUsers = await User.count();
    const totalPages = Math.ceil(totalUsers / limit);

    res.render('admin/users', {
      adminName: req.session.adminName,
      users,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error('Users list error:', error);
    res.status(500).send('Error loading users');
  }
};

// User details
const userDetails = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('User not found');
    }

    // Get user's files
    const filesResult = await query(`
      SELECT id, file_name, file_size, mime_type, created_at
      FROM files
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 20
    `, [userId]);

    // Get storage usage
    const storageResult = await query(`
      SELECT COALESCE(SUM(file_size), 0) as total_size, COUNT(*) as file_count
      FROM files
      WHERE user_id = $1
    `, [userId]);

    res.render('admin/user-details', {
      adminName: req.session.adminName,
      user,
      files: filesResult.rows,
      storage: storageResult.rows[0],
    });
  } catch (error) {
    console.error('User details error:', error);
    res.status(500).send('Error loading user details');
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    await User.delete(userId);
    res.redirect('/admin/users');
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).send('Error deleting user');
  }
};

// Files list
const filesList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 50;
    const offset = (page - 1) * limit;

    const filesResult = await query(`
      SELECT f.*, u.email as user_email
      FROM files f
      JOIN users u ON f.user_id = u.id
      ORDER BY f.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const countResult = await query('SELECT COUNT(*) as count FROM files');
    const totalFiles = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalFiles / limit);

    res.render('admin/files', {
      adminName: req.session.adminName,
      files: filesResult.rows,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error('Files list error:', error);
    res.status(500).send('Error loading files');
  }
};


// Settings page
const settingsPage = async (req, res) => {
  try {
    const result = await query('SELECT key, value FROM app_settings');
    
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });

    // Ensure defaults exist
    if (!settings.min_version) settings.min_version = '1.0.0';
    if (!settings.latest_version) settings.latest_version = '1.0.0';
    if (!settings.store_url_android) settings.store_url_android = '';
    if (!settings.store_url_ios) settings.store_url_ios = '';
    if (!settings.force_update) settings.force_update = 'false';

    res.render('admin/settings', {
      adminName: req.session.adminName,
      settings,
      success: req.query.success === 'true' ? 'Settings updated successfully' : null,
      error: null
    });
  } catch (error) {
    console.error('Settings page error:', error);
    res.status(500).send('Error loading settings');
  }
};

// Update settings
const updateSettings = async (req, res) => {
  try {
    const { min_version, latest_version, store_url_android, store_url_ios, force_update } = req.body;
    
    const settings = [
      { key: 'min_version', value: min_version },
      { key: 'latest_version', value: latest_version },
      { key: 'store_url_android', value: store_url_android },
      { key: 'store_url_ios', value: store_url_ios },
      { key: 'force_update', value: force_update === 'on' ? 'true' : 'false' },
    ];

    // Use a transaction since we are updating multiple rows
    // Note: upsert in pg is INSERT ON CONFLICT. But since we seeded, UPDATE is safe?
    // Let's use ON CONFLICT to be safe.
    for (const setting of settings) {
      await query(
        'INSERT INTO app_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP',
        [setting.key, setting.value]
      );
    }

    res.redirect('/admin/settings?success=true');
  } catch (error) {
    console.error('Update settings error:', error);
    res.render('admin/settings', {
      adminName: req.session.adminName,
      settings: req.body, // Keep user input
      success: null,
      error: 'Failed to update settings'
    });
  }
};

module.exports = {
  loginPage,
  login,
  logout,
  dashboard,
  usersList,
  userDetails,
  deleteUser,
  filesList,
  settingsPage,
  updateSettings,
};
