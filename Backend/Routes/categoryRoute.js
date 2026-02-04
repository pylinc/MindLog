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
router.get('/', authMiddleware, getAll);
router.get('/:id', authMiddleware, validateObjectId, getSingle);
router.post('/', authMiddleware, validateCategory, createCategory);
router.put('/:id', authMiddleware, validateObjectId, validateCategory, updateCategory);
router.delete('/:id', authMiddleware, validateObjectId, deleteCategory);

module.exports = router;


