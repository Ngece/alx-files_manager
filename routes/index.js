const express = require('express');

const router = express.Router();

const AppController = require('../controllers/AppController');
const AuthController = require('../controllers/AuthController');
const UsersController = require('../controllers/UsersController');
const FilesController = require('../controllers/FilesController');

// The /status endpoint
router.get('/status', AppController.getStatus);

// The /stats endpoint
router.get('/stats', AppController.getStats);

// Define the /connect endpoint
router.get('/connect', AuthController.getConnect);

// Define the /disconnect endpoint
router.get('/disconnect', AuthController.getDisconnect);

// Define the /users/me endpoint
router.get('/users/me', UsersController.getMe);

// Define the /users endpoint
router.post('/users', UsersController.postNew);

// Define the /files endpoint
router.post('/files', FilesController.postUpload);

module.exports = router;
