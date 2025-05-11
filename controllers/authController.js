const userModel = require('../models/users')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { generateToken } = require('../utils/generateToken')

module.exports.registerUser = async (req,res)=>{
    try{
        let {fullname,email,password} = req.body
        let user = await userModel.findOne({email:email})
        if(user) {
            req.flash('error', 'User already exists')
            return res.redirect('/') // redirect with error message
        }
         
        bcrypt.genSalt(10,(err,salt)=>{
            bcrypt.hash(password,salt,async(err,hash)=>{
                if(err) {
                    req.flash('error', err.message || 'Error creating account')
                    return res.redirect('/') // redirect with error message
                } else {
                    let createdUser = await userModel.create({
                        fullname,
                        email,
                        password: hash
                    })
                    let token = generateToken(createdUser) // generate token
                    res.cookie('token',token) // set token in cookie
                    res.redirect('/shop') // Redirect to shop page instead of sending success message
                }
            })
        })
    }
    catch(err){
        req.flash('error', err.message || 'Something went wrong')
        return res.redirect('/') // redirect with error message
    }
}

module.exports.loginUser = async(req,res)=>{
    try {
        let {email,password} = req.body
        let user = await userModel.findOne({email:email})
        if(!user) {
            req.flash('error', 'Email or password is incorrect')
            return res.redirect('/') // Redirect to home page with error message
        }
        
        // If user exists, compare password with hashed password
        bcrypt.compare(password, user.password, (err, result)=>{
            if(err) {
                req.flash('error', 'Error comparing passwords')
                return res.redirect('/') // Redirect with error message
            }
            
            if(result) {
                // Password matches, generate token and set cookie
                let token = generateToken(user) // generate token
                res.cookie('token', token) // set token in cookie
                res.redirect('/shop') // Redirect to shop page instead of sending success message
            } else {
                // Password doesn't match
                req.flash('error', 'Email or password is incorrect')
                return res.redirect('/') // Redirect to home page with error message
            }
        })
    } catch(err) {
        req.flash('error', err.message || 'Something went wrong')
        return res.redirect('/') // Redirect with error message
    }
}

module.exports.logout = (req,res)=>{
    res.cookie('token','') // clear the token from cookies
    res.redirect('/') // redirect to home page
}