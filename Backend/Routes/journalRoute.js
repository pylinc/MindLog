const express = require('express');
const router = express.Router();
const { getAll, 
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

router.get('/getall', authMiddleware, getAll);
router.get('/search', authMiddleware, searchJournals);
router.get('/stats/mood', authMiddleware, moodStatics);
router.get('/stats/analytics', authMiddleware, journalAnalytics);

router.get('/:id', authMiddleware, singleJournal);
router.post('/create', authMiddleware, createJournal);
router.put('/update/:id', authMiddleware, updateJournal);
router.delete('/delete/:id', authMiddleware, deleteJournal);
router.put('/favorite/:id', authMiddleware, favoriteJournal);

module.exports = router;
