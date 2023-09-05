const express = require('express');

const router = express.Router();

const AppController = require('../controllers/AppController');

// The /status endpoint
router.get('/status', AppController.getStatus);

// The /stats endpoint
router.get('/stats', AppController.getStats);

module.exports = router;
