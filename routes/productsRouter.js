const express = require('express')
const router = express.Router()
const productModel = require('../models/product')
const isLoggedIn = require('../middlewares/isLoggedIn')
const isOwner = require('../middlewares/isOwner')

router.post('/create', isLoggedIn, isOwner, async (req, res) => {
    try {
        console.log('Creating new product');
        console.log('Request body:', req.body);
        console.log('Request files:', req.files);

        const { name, price, discount, bgcolor, panelcolor, textcolor } = req.body;

        // Validate required fields
        if (!name || !price || !discount) {
            console.log('Validation failed: Missing required fields');
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
            console.log('Image uploaded:', req.files.image);
            productData.image = req.files.image.data;
        } else {
            console.log('No image uploaded');
            // Optionally, set a default image or handle the missing image case
            // For now, we'll throw an error to enforce image upload
            req.flash('error', 'Image is required');
            return res.redirect('/owners/admin');
        }

        const product = new productModel(productData);
        await product.save();
        console.log('Product created successfully:', product);
        req.flash('success', 'Product created successfully');
        res.redirect('/owners/admin');
    } catch (err) {
        console.error('Error creating product:', err.message);
        req.flash('error', `Failed to create product: ${err.message}`);
        res.redirect('/owners/admin');
    }
});

module.exports = router;