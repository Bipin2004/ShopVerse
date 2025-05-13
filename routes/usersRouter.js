const express = require('express')
const router = express.Router()
const isLoggedIn = require('../middlewares/isLoggedIn')
const passport = require('passport')
const {registerUser,loginUser,logout} = require('../controllers/authController')

router.get('/',(req,res)=>{
    res.send("hey it's working")
})

router.post('/register',registerUser)
router.post('/login',loginUser)
router.post('/logout',logout)

// Google OAuth Routes
router.get('/auth/google', 
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/auth/google/callback', 
    passport.authenticate('google', { 
        failureRedirect: '/login', 
        failureFlash: true 
    }),
    function(req, res) {
        // Successful authentication, redirect to profile
        res.redirect('/profile');
    }
);



module.exports = router