// Middleware to check if the user is an owner
const userModel = require('../models/users');

module.exports = async (req, res, next) => {
    try {
        // First check if user is logged in
        if (!req.user) {
            req.flash('error', 'Please login to access this page');
            return res.redirect('/');
        }
        
        // Check if the user has owner privileges
        const user = await userModel.findOne({email: req.user.email});
        if (user && user.isOwner) {
            return next(); // Allow access if user is an owner
        }
        
        // Deny access if not an owner
        req.flash('error', 'You are not authorized to access this page');
        return res.redirect('/'); // Redirect to home page
    } catch (err) {
        console.error('Error in owner authorization:', err);
        req.flash('error', 'An error occurred during authorization');
        return res.redirect('/');
    }
};