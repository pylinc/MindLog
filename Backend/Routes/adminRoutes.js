const express = require('express');
const router = express.Router();
const adminController = require('../Controller/adminController');
const promptController = require('../Controller/promptController');
const { authMiddleware } = require('../Middleware/auth');
const { adminMiddleware } = require('../Middleware/admin');

// All routes require Auth + Admin role
router.use(authMiddleware, adminMiddleware);

// Stats
router.get('/stats', adminController.getDashboardStats);

// Prompts Management
router.post('/prompts', promptController.createPrompt);
router.put('/prompts/:id', promptController.updatePrompt);
router.delete('/prompts/:id', promptController.deletePrompt);
// Note: getPrompts is likely public or shared, but admins might need a specific view. 
// For now, we reuse the promptController but we might want a 'getAll' including inactive.

module.exports = router;
