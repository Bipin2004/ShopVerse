const express = require('express')
const router = express.Router()
const isLoggedIn = require('../middlewares/isLoggedIn')
const productModel = require('../models/product')
const userModel = require('../models/users')

router.get('/', (req, res) => {
    let error = req.flash('error')
    let loggedIn = !!req.cookies.token
    let isOwner = false
    if (loggedIn && req.user) {
        isOwner = req.user.isOwner || false
    }
    res.render('index', { error, loggedIn, isOwner })
})

router.get('/profile', isLoggedIn, async (req, res) => {
    try {
        const user = await userModel.findOne({email: req.user.email})
        const isOwner = req.user.isOwner || false
        res.render('profile', { user, isOwner })
    } catch (err) {
        console.error('Error fetching user profile:', err)
        res.status(500).send('Error loading profile')
    }
})

router.get('/shop', isLoggedIn, async (req, res) => {
    try {
        const { sortby, category, filter, search } = req.query;
        let queryObj = {};

        // Handle search query
        if (search) {
            queryObj.name = { $regex: search, $options: 'i' }; // Case-insensitive search
        }

        // Handle category and filter
        if (category === 'discounted' || filter === 'discount') {
            queryObj.discount = { $gt: 0 };
        }

        const productQuery = productModel.find(queryObj);

        if (sortby === 'newest') {
            productQuery.sort({ _id: -1 });
        } else if (sortby === 'popular') {
            productQuery.sort({ discount: -1 });
        }

        const products = await productQuery;
        const isOwner = req.user.isOwner || false;
        const success = req.flash('success');
        res.render('shop', { products, success, isOwner, sortby, category, filter });
    } catch (err) {
        console.error('Error fetching products:', err)
        res.status(500).send('Error loading products')
    }
})

// New Search Route for Live Suggestions
router.get('/search', async (req, res) => {
    try {
        const { query } = req.query;
        if (!query || query.length < 2) {
            return res.json([]);
        }

        const products = await productModel
            .find({ name: { $regex: query, $options: 'i' } }) // Case-insensitive search
            .limit(5) // Limit to 5 suggestions
            .select('name price discount image'); // Select only needed fields

        // Convert image buffers to base64 for JSON response
        const productsWithBase64 = products.map(product => ({
            name: product.name,
            price: product.price,
            discount: product.discount,
            image: product.image.toString('base64')
        }));

        res.json(productsWithBase64);
    } catch (err) {
        console.error('Error fetching search suggestions:', err);
        res.status(500).json([]);
    }
});

router.get('/addtocart/:productid', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({email: req.user.email})
    user.cart.push(req.params.productid)
    await user.save()
    req.flash('success', 'Product added to cart')
    res.redirect('/shop')
})

router.get('/cart', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({email: req.user.email}).populate('cart')
    let bill = 0;
    if (user.cart && user.cart.length > 0) {
        user.cart.forEach(item => {
            bill += Number(item.price) - Number(item.discount);
        });
        bill += 20;
    }
    const isOwner = req.user.isOwner || false
    res.render('cart', { user, bill, isOwner })
})

router.post('/update-cart-quantity/:productId/:quantity', isLoggedIn, async (req, res) => {
    try {
        const productId = req.params.productId;
        const quantity = parseInt(req.params.quantity);
        if (isNaN(quantity) || quantity < 1) {
            return res.status(400).json({ error: 'Invalid quantity' });
        }
        res.json({ success: true, message: 'Quantity updated', productId, quantity });
    } catch (err) {
        console.error('Error updating cart quantity:', err);
        res.status(500).json({ error: 'Failed to update cart quantity' });
    }
});

router.delete('/remove-from-cart/:productId', isLoggedIn, async (req, res) => {
    try {
        const productId = req.params.productId;
        const user = await userModel.findOne({ email: req.user.email });
        user.cart = user.cart.filter(id => id.toString() !== productId.toString());
        await user.save();
        res.json({ success: true, message: 'Item removed from cart' });
    } catch (err) {
        console.error('Error removing item from cart:', err);
        res.status(500).json({ error: 'Failed to remove item from cart' });
    }
});

router.get('/logout', isLoggedIn, (req, res) => {
    res.cookie('token', '')
    res.redirect('/')
})

const isOwner = require('../middlewares/isOwner')

router.get('/admin', isLoggedIn, isOwner, async (req, res) => {
    try {
        const products = await productModel.find({})
        const users = await userModel.find({})
        res.render('admin', { products, users, isOwner: true })
    } catch (err) {
        console.error('Error accessing admin dashboard:', err)
        res.status(500).send('Error loading admin dashboard')
    }
})

module.exports = router