const express = require('express')
const router = express.Router()
const ownerModel = require('../models/owner-model')


if(process.env.NODE_ENV === 'development'){ 
    router.post('/create',async (req,res)=>{
        let owners = await ownerModel.find();
        if(owners.length > 0){ // check if owners already exist
             return res
             .status(504)
             .send("You don't have permission to create a new owner")
        }
        let {fullname,email,password} = req.body
        let createdOwner = await ownerModel.create({
            fullname,
            email,
            password
        })
        res.status(201).send(createdOwner)
    })
}


router.get('/admin',(req,res)=>{
    let success = req.flash('success')
    res.render("createproducts", { success }) // render the createproducts page and pass an empty success message
})

// console.log(process.env.NODE_ENV)


module.exports = router