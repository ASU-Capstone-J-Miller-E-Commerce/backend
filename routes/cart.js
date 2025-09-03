const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Cue = require('../models/cue');
const Accessory = require('../models/accessory');
const { makeError, makeResponse } = require('../response/makeResponse');

// Get user's cart with populated item details
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json(makeError(["User not found"]));
        }

        // Populate cart items with actual product details
        const cartWithDetails = await Promise.all(
            user.cart.map(async (cartItem) => {
                let itemDetails = null;
                
                if (cartItem.itemType === 'cue') {
                    itemDetails = await Cue.findOne({ guid: cartItem.itemGuid });
                } else if (cartItem.itemType === 'accessory') {
                    itemDetails = await Accessory.findOne({ guid: cartItem.itemGuid });
                }

                return {
                    cartItemId: cartItem._id,
                    itemGuid: cartItem.itemGuid,
                    itemType: cartItem.itemType,
                    quantity: cartItem.quantity,
                    addedAt: cartItem.addedAt,
                    itemDetails: itemDetails
                };
            })
        );

        // Filter out items that no longer exist
        const validCartItems = cartWithDetails.filter(item => item.itemDetails);

        // If some items were removed, update the user's cart
        if (validCartItems.length !== user.cart.length) {
            user.cart = user.cart.filter(cartItem => 
                validCartItems.some(validItem => validItem.cartItemId.equals(cartItem._id))
            );
            await user.save();
        }

        res.status(200).json(makeResponse('success', { 
            items: validCartItems,
            totalItems: validCartItems.reduce((sum, item) => sum + item.quantity, 0)
        }));
    } catch (error) {
        res.status(500).json(makeError(["internal server error, please try again later or contact support"]));
    }
});

// Add item to cart
router.post('/add', async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemGuid, itemType, quantity = 1 } = req.body;

        if (!itemGuid || !itemType) {
            return res.status(400).json(makeError(["Item GUID and type are required"]));
        }

        if (!['cue', 'accessory'].includes(itemType)) {
            return res.status(400).json(makeError(["Invalid item type"]));
        }

        // Verify item exists and is available
        let item = null;
        if (itemType === 'cue') {
            item = await Cue.findOne({ guid: itemGuid });
            if (!item || item.status !== 'Available') {
                return res.status(400).json(makeError(["Cue is not available"]));
            }
        } else if (itemType === 'accessory') {
            item = await Accessory.findOne({ guid: itemGuid });
            if (!item || item.status !== 'Available') {
                return res.status(400).json(makeError(["Accessory is not available"]));
            }
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(makeError(["User not found"]));
        }

        // Check if item already exists in cart
        const existingCartItemIndex = user.cart.findIndex(
            cartItem => cartItem.itemGuid === itemGuid && cartItem.itemType === itemType
        );

        if (existingCartItemIndex > -1) {
            // For cues, don't allow duplicates (quantity should remain 1)
            if (itemType === 'cue') {
                return res.status(400).json(makeError(["Cue is already in your cart"]));
            }
            // For accessories, update quantity
            user.cart[existingCartItemIndex].quantity += quantity;
        } else {
            // Add new item to cart
            user.cart.push({
                itemGuid,
                itemType,
                quantity: itemType === 'cue' ? 1 : quantity, // Cues are always quantity 1
                addedAt: new Date()
            });
        }

        await user.save();
        res.status(200).json(makeResponse("success", "Item added to cart successfully"));
    } catch (error) {
        res.status(500).json(makeError(["Internal server error"]));
    }
});

// Update cart item quantity
router.put('/update/:cartItemId', async (req, res) => {
    try {
        const userId = req.user.id;
        const { cartItemId } = req.params;
        const { quantity } = req.body;

        if (!quantity || quantity < 1) {
            return res.status(400).json(makeError(["Invalid quantity"]));
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(makeError(["User not found"]));
        }

        const cartItem = user.cart.id(cartItemId);
        if (!cartItem) {
            return res.status(404).json(makeError(["Cart item not found"]));
        }

        // Don't allow changing quantity for cues
        if (cartItem.itemType === 'cue' && quantity !== 1) {
            return res.status(400).json(makeError(["Cue quantity cannot be changed"]));
        }

        cartItem.quantity = quantity;
        await user.save();

        res.status(200).json(makeResponse('success'));
    } catch (error) {
        res.status(500).json(makeError(["Internal server error"]));
    }
});

// Remove item from cart
router.delete('/remove/:cartItemId', async (req, res) => {
    try {
        const userId = req.user.id;
        const { cartItemId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(makeError(["User not found"]));
        }

        const cartItemIndex = user.cart.findIndex(item => item._id.toString() === cartItemId);
        if (cartItemIndex === -1) {
            return res.status(404).json(makeError(["Cart item not found"]));
        }

        user.cart.splice(cartItemIndex, 1);
        await user.save();

        res.json(makeResponse('success'));
    } catch (error) {
        res.status(500).json(makeError(["Internal server error"]));
    }
});

// Clear entire cart
router.delete('/clear', async (req, res) => {
    try {
        const userId = req.user.id;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(makeError(["User not found"]));
        }

        user.cart = [];
        await user.save();

        res.status(200).json(makeResponse(true, "Cart cleared successfully"));
    } catch (error) {
        res.status(500).json(makeError(["Internal server error"]));
    }
});

module.exports = router;
