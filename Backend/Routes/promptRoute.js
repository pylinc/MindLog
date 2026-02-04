const express = require('express');
const router = express.Router();

const {
    getAllPrompts,
    getRandomPrompt,
    getPromptsByCategory,
    createPrompt,
    updatePrompt,
    deletePrompt
} = require('../Controller/promptController');

const { authMiddleware } = require('../Middleware/auth');
const { adminMiddleware } = require('../Middleware/admin');
const {
    validatePrompt,
    validateObjectId
} = require('../Middleware/validation');

// Public routes - no authentication required
router.get('/getall', getAllPrompts);
router.get('/random', getRandomPrompt);
router.get('/category/:category', getPromptsByCategory);

// Admin-only routes - require authentication and admin role
router.post('/create', authMiddleware, adminMiddleware, validatePrompt, createPrompt);
router.put('/update/:id', authMiddleware, adminMiddleware, validateObjectId, validatePrompt, updatePrompt);
router.delete('/delete/:id', authMiddleware, adminMiddleware, validateObjectId, deletePrompt);

module.exports = router;

