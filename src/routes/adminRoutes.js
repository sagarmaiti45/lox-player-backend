const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// Root admin route - redirect based on authentication
router.get('/', (req, res) => {
  if (req.session && req.session.adminId) {
    res.redirect('/admin/dashboard');
  } else {
    res.redirect('/admin/login');
  }
});

// Public admin routes
router.get('/login', adminController.loginPage);
router.post('/login', adminController.login);

// Protected admin routes
router.get('/logout', authenticateAdmin, adminController.logout);
router.get('/dashboard', authenticateAdmin, adminController.dashboard);
router.get('/users', authenticateAdmin, adminController.usersList);
router.get('/users/:id', authenticateAdmin, adminController.userDetails);
router.post('/users/:id/delete', authenticateAdmin, adminController.deleteUser);
router.get('/files', authenticateAdmin, adminController.filesList);
router.get('/settings', authenticateAdmin, adminController.settingsPage);
router.post('/settings', authenticateAdmin, adminController.updateSettings);

module.exports = router;
