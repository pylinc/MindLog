const express = require('express');
const router = express.Router();

const {
    signUp,
    login,
    currentUser,
    updateUser,
    updatePrefrences,
    changePassword,
    logout
} = require('../Controller/authController');

const { authMiddleware } = require('../Middleware/auth');
const {
    validateRegistration,
    validateLogin,
    validateProfileUpdate,
    validatePreferencesUpdate,
    validatePasswordChange
} = require('../Middleware/validation');

// Public routes with validation
router.post('/signup', validateRegistration, signUp);
router.post('/login', validateLogin, login);

// Protected routes with authentication and validation
router.get('/me', authMiddleware, currentUser);
router.put('/update', authMiddleware, validateProfileUpdate, updateUser);
router.put('/updatePreferences', authMiddleware, validatePreferencesUpdate, updatePrefrences);
router.put('/changePassword', authMiddleware, validatePasswordChange, changePassword);
router.post('/logout', authMiddleware, logout);

module.exports = router;
