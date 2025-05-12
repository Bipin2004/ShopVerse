const express = require('express')
const router = express.Router()
const productModel = require('../models/product')
const isLoggedIn = require('../middlewares/isLoggedIn')
const isOwner = require('../middlewares/isOwner')

router.post('/create', isLoggedIn, isOwner, async (req, res) => {
    try {
        const { name, price, discount, bgcolor, panelcolor, textcolor } = req.body;

        // Validate required fields
        if (!name || !price || !discount) {
            req.flash('error', 'Name, price, and discount are required');
            return res.redirect('/owners/admin');
        }

        // Create product data
        const productData = {
            name,
            price: Number(price),
            discount: Number(discount),
            bgcolor: bgcolor || '#ffffff',
            panelcolor: panelcolor || '#ffffff',
            textcolor: textcolor || '#000000'
        };

        // Handle image upload (optional)
        if (req.files && req.files.image && req.files.image.data) {
            productData.image = req.files.image.data;
        } else {
            req.flash('error', 'Image is required');
            return res.redirect('/owners/admin');
        }

        const product = new productModel(productData);
        await product.save();
        req.flash('success', 'Product created successfully');
        res.redirect('/owners/admin');
    } catch (err) {
        console.error('Error creating product:', err.message);
        req.flash('error', `Failed to create product: ${err.message}`);
        res.redirect('/owners/admin');
    }
});

module.exports = router;