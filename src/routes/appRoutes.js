const express = require('express');
const appController = require('../controllers/appController');

const router = express.Router();

// Public route to get app version info
router.get('/version', appController.getVersion);

module.exports = router;
