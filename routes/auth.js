const express = require('express');
const {login , register,getMe,updateProfile,changePassword} = require('../controllers/authController')
const {auth} = require('../middleware/auth');

const router = express.Router();

router.post('/register',register);
router.post('login',login)

router.use(auth);

router.get('/me',getMe);
router.patch('/update-profile',updateProfile);
router.patch('/change-password',changePassword);

module.exports = router;