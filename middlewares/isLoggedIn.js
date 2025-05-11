const jwt = require("jsonwebtoken");
const userModel = require("../models/users");
module.exports = async function (req, res, next) {
if(!req.cookies.token) { // if token is not present in cookies then it will show that user have to login first
req.flash("error", "you need to login first");
return res.redirect("/"); // redirect to home page if not logged in
}
try { // if  the user has token then it will verify the token and get the user details from the database
let decoded = jwt.verify( req.cookies.token, process.env.JWT_KEY); // verify the token using jwt
let user = await userModel
.findOne({ email: decoded.email})
.select ("-password" ) ; // find the user in the database using email and exclude password from the result
req.user = user; // set the user in the request object so that it can be used in the next middleware or route handler
next();
} catch (err) {
req.flash ("something went wrong." ) ;
res. redirect ( "/" ) ;
}
}