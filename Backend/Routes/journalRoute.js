const express = require('express');
const router = express.Router();

const { 
    getAll, 
    singleJournal, 
    createJournal, 
    updateJournal, 
    deleteJournal, 
    favoriteJournal,
    moodStatics,
    journalAnalytics,
    searchJournals
} = require('../Controller/journalController');

const { authMiddleware } = require('../Middleware/auth');
const {
    validateJournal,
    validateObjectId,
    validatePagination,
    validateSearch
} = require('../Middleware/validation');

// Get all journals with pagination validation
router.get('/getall', authMiddleware, validatePagination, getAll);

// Search journals with search validation
router.get('/search', authMiddleware, validateSearch, searchJournals);

// Statistics routes
router.get('/stats/mood', authMiddleware, moodStatics);
router.get('/stats/analytics', authMiddleware, journalAnalytics);

// CRUD routes with validation
router.get('/:id', authMiddleware, validateObjectId, singleJournal);
router.post('/create', authMiddleware, validateJournal, createJournal);
router.put('/update/:id', authMiddleware, validateObjectId, validateJournal, updateJournal);
router.delete('/delete/:id', authMiddleware, validateObjectId, deleteJournal);
router.put('/favorite/:id', authMiddleware, validateObjectId, favoriteJournal);

module.exports = router;

