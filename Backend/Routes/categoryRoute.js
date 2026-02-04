const express = require('express');
const router = express.Router();

const {
    getAll,
    getSingle,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../Controller/categoryController');

const { authMiddleware } = require('../Middleware/auth');
const {
    validateCategory,
    validateObjectId
} = require('../Middleware/validation');

// All category routes require authentication
router.get('/getall', authMiddleware, getAll);
router.get('/:id', authMiddleware, validateObjectId, getSingle);
router.post('/create', authMiddleware, validateCategory, createCategory);
router.put('/update/:id', authMiddleware, validateObjectId, validateCategory, updateCategory);
router.delete('/delete/:id', authMiddleware, validateObjectId, deleteCategory);

module.exports = router;

