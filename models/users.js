const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    fullname : {
        type : String,
        minLength : 3,
        trim : true
    },
    email : String,
    password : String,
    contact : Number,
    cart : {
        type : Array,
        default : []
    },
    isAdmin : Boolean,
    orders : {
        type : Array,
        default : []
    },
    picture : String
})

module.exports = mongoose.model('user', userSchema)
