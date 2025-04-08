const express = require('express')
const app = express()
const userModel = require('./models/users')
const path = require('path')
const cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const port = 3000
const product = require('./models/product')
const user = require('./models/users')
const db = require('./config/mongoose-connection')
const ownersRouter = require('./routes/ownersRouter')
const usersRouter = require('./routes/usersRouter')
const productsRouter = require('./routes/productsRouter')

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname,'public')))
app.set('view engine', 'ejs')
app.use(cookieParser())

app.use('/owners',ownersRouter)
app.use('/users',usersRouter)
app.use('/products',productsRouter)
 


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })