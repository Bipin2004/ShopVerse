const express = require('express')
const router = express.Router()
const isLoggedIn = require('../middlewares/isLoggedIn')
const {registerUser,loginUser,logout} = require('../controllers/authController')

router.get('/',(req,res)=>{
    res.send("hey it's working")
})

router.post('/register',registerUser)
router.post('/login',loginUser)
router.post('/logout',logout) 

module.exports = router