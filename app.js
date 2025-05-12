const express = require('express')
const app = express()
const userModel = require('./models/users')
const path = require('path')
const cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const expressSession = require('express-session') // session management
const flash = require('connect-flash') // flash messages
const fileUpload = require('express-fileupload') // file upload middleware
const port = 3000
const product = require('./models/product')
const db = require('./config/mongoose-connection')
const ownersRouter = require('./routes/ownersRouter')
const usersRouter = require('./routes/usersRouter')
const productsRouter = require('./routes/productsRouter')
const indexRouter = require('./routes/index')

require('dotenv').config()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname,'public')))
app.set('view engine', 'ejs')
app.use(cookieParser())
app.use(expressSession({
    resave: false,
    saveUninitialized: false,
    secret: process.env.EXPRESS_SESSION_SECRET,
})) // We need express-session to use flash messages. It helps to create a session for the user.

app.use(flash()) // flash messages middleware
app.use(fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
    abortOnLimit: true, // Abort request if file exceeds limit
    responseOnLimit: 'File size limit exceeded (max 5MB)', // Response message for limit exceeded
    safeFileNames: true, // Sanitize file names
    preserveExtension: true // Preserve file extensions
})) // Enable file uploads with configuration

app.use('/',indexRouter)
app.use('/owners',ownersRouter)
app.use('/users',usersRouter)
app.use('/products',productsRouter)

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})