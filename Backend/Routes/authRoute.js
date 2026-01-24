const express = require('express');
const router = express.Router();

const{
    signUp,
    login,
    currentUser,
    updateUser,
    updatePrefrences,
    changePassword,
    logout

}  = require('../Controller/authController');
const {authMiddleware} = require('../Middleware/auth');

router.post('/signup',signUp);
router.post('/login',login);
router.get('/me',authMiddleware,currentUser);
router.put('/update',authMiddleware,updateUser);
router.put('/updatePreferences',authMiddleware,updatePrefrences);
router.put('/changePassword',authMiddleware,changePassword);
router.post('/logout',authMiddleware,logout);

module.exports = router;