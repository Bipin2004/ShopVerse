const express = require('express')
const router = express.Router()
const isLoggedIn = require('../middlewares/isLoggedIn')
const productModel = require('../models/product')
const userModel = require('../models/users')

router.get('/', async (req, res) => {
    let error = req.flash('error')
    let loggedIn = !!req.cookies.token
    let isOwner = false
    let previewProducts = []
    try {
        // Fetch 3 products for preview, sorted by newest
        previewProducts = await productModel.find().sort({ _id: -1 }).limit(3)
        
        // Convert Buffer images to base64 strings
        previewProducts = previewProducts.map(product => {
            const productObj = product.toObject()
            if (productObj.image) {
                productObj.image = productObj.image.toString('base64')
            }
            return productObj
        })
    } catch (err) {
        console.error('Error fetching preview products:', err.message)
    }
    if (loggedIn && req.user) {
        isOwner = req.user.isOwner || false
    }
    res.render('index', { error, loggedIn, isOwner, previewProducts, currentPage: 'home' })
})

router.get('/login', async (req, res) => {
    let error = req.flash('error')
    let loggedIn = !!req.cookies.token
    let isOwner = false
    
    if (loggedIn && req.user) {
        isOwner = req.user.isOwner || false
        return res.redirect('/shop')
    }
    
    res.render('login', { error, loggedIn, isOwner, currentPage: 'login' })
})

router.get('/profile', isLoggedIn, async (req, res) => {
    try {
        const user = await userModel.findOne({email: req.user.email})
        const isOwner = req.user.isOwner || false
        res.render('profile', { user, isOwner, currentPage: 'profile' })
    } catch (err) {
        console.error('Error fetching user profile:', err.message)
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

        let products = await productQuery;
        // Convert products to plain objects and transform the image Buffer to base64
        products = products.map(product => {
            const productObj = product.toObject();
            if (productObj.image) {
                productObj.image = productObj.image.toString('base64');
            }
            return productObj;
        });
        
        const isOwner = req.user.isOwner || false;
        const success = req.flash('success');
        res.render('shop', { products, success, isOwner, sortby, category, filter, currentPage: 'shop' });
    } catch (err) {
        console.error('Error fetching products:', err.message)
        res.status(500).send('Error loading products')
    }
})

// Search Route for Live Suggestions
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
        console.error('Error fetching search suggestions:', err.message);
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
    
    // Convert user object to a plain object to manipulate
    const userObj = user.toObject();
    
    if (userObj.cart && userObj.cart.length > 0) {
        userObj.cart.forEach(item => {
            // Convert image buffer to base64 string
            if (item.image) {
                item.image = item.image.toString('base64');
            }
            
            bill += Number(item.price) - Number(item.discount);
        });
        bill += 20;
    }
    
    const isOwner = req.user.isOwner || false
    res.render('cart', { user: userObj, bill, isOwner, currentPage: 'cart' })
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
        console.error('Error updating cart quantity:', err.message);
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
        console.error('Error removing item from cart:', err.message);
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
        res.render('admin', { products, users, isOwner: true, currentPage: 'admin' })
    } catch (err) {
        console.error('Error accessing admin dashboard:', err.message)
        res.status(500).send('Error loading admin dashboard')
    }
})

router.get('/owners/admin', isLoggedIn, isOwner, (req, res) => {
    const success = req.flash('success')
    res.render('createproducts', { success, isOwner: true, currentPage: 'createproducts' })
})

// Fetch Product Details for Editing
router.get('/admin/edit/:productId', isLoggedIn, isOwner, async (req, res) => {
    try {
        const productId = req.params.productId;
        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (err) {
        console.error('Error fetching product for editing:', err.message);
        res.status(500).json({ error: `Server error: ${err.message}` });
    }
});

// Update Product
router.post('/admin/edit/:productId', isLoggedIn, isOwner, async (req, res) => {
    try {
        const productId = req.params.productId;
        const { name, price, discount, bgcolor, panelcolor, textcolor } = req.body;

        // Validate required fields
        if (!name || !price || !discount) {
            return res.status(400).json({ error: 'Name, price, and discount are required' });
        }

        const updateData = {
            name,
            price: Number(price),
            discount: Number(discount),
            bgcolor: bgcolor || '#ffffff',
            panelcolor: panelcolor || '#ffffff',
            textcolor: textcolor || '#000000'
        };

        // Safely handle image upload
        if (req.files && req.files.image && req.files.image.data) {
            updateData.image = req.files.image.data;
        } else {
            // Fetch the existing product to retain the current image
            const existingProduct = await productModel.findById(productId);
            if (!existingProduct) {
                return res.status(404).json({ error: 'Product not found' });
            }
            updateData.image = existingProduct.image; // Retain the existing image
        }

        const updatedProduct = await productModel.findByIdAndUpdate(productId, updateData, { new: true });
        if (!updatedProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ success: true, message: 'Product updated successfully' });
    } catch (err) {
        console.error('Error updating product:', err.message);
        res.status(500).json({ error: `Server error: ${err.message}` });
    }
});

// Delete Product
router.delete('/admin/delete/:productId', isLoggedIn, isOwner, async (req, res) => {
    try {
        const productId = req.params.productId;
        const deletedProduct = await productModel.findByIdAndDelete(productId);
        if (!deletedProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }
        // Remove the product from all users' carts
        await userModel.updateMany(
            { cart: productId },
            { $pull: { cart: productId } }
        );
        res.json({ success: true, message: 'Product deleted successfully' });
    } catch (err) {
        console.error('Error deleting product:', err.message);
        res.status(500).json({ error: `Server error: ${err.message}` });
    }
});

module.exports = router