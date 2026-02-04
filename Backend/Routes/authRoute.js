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
router.post('/auth/register', validateRegistration, signUp);
router.post('/auth/login', validateLogin, login);

// Protected routes with authentication and validation
router.get('/auth/me', authMiddleware, currentUser);
router.put('/auth/update', authMiddleware, validateProfileUpdate, updateUser);
router.put('/auth/updatePreferences', authMiddleware, validatePreferencesUpdate, updatePrefrences);
router.put('/auth/changePassword', authMiddleware, validatePasswordChange, changePassword);
router.post('/auth/logout', authMiddleware, logout);

module.exports = router;
