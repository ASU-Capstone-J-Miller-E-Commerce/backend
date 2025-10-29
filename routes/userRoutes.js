const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const validator = require('validator')
const user = require('../models/user')
const Order = require('../models/order')
const Cue = require('../models/cue')
const Accessory = require('../models/accessory')
const router = express.Router()
const { makeError, makeResponse } = require('../response/makeResponse')
const { authUser } = require('./authorization')
require('dotenv').config()
const jwtSecret = process.env.JWT_SECRET_KEY


router.put('/update-name/:email', authUser, async (req, res) =>
{
    try
    {
        const {email} = req.params;
        const {newFirstName, newLastName} = req.body;
        const editedUser = await user.findOne({email: email});

        if(!editedUser)
        {
            return res.status(404).json(makeError(['User not found.']));
        }
        if(newFirstName && newFirstName != '')
        {
            if( newFirstName.length > 30)
            {
                return res.status(400).json(makeError(['Your first name cannot be more than 30 characters long.']));
            }
            editedUser.firstName = newFirstName;
        }
        if(newLastName && newLastName != '' && newLastName.length < 30)
        {
            if( newLastName.length > 30)
            {
                return res.status(400).json(makeError(['Your last name cannot be more than 30 characters long.']));
            }
            editedUser.lastName = newLastName;
        }
        
        
        await editedUser.save();

        return res.status(200).json(makeResponse('success', false, ['Name saved successfully.'], false));

    }catch(ex)
    {
        console.error(ex);
        res.status(400).json(makeError(['Something went wrong.']));
    }
});


router.put('/userChangePassword', authUser, async (req, res) =>
    {
        try
        {
            const {currPw, newPw} = req.body;
            const token = req.cookies.jwt;
            const decoded = jwt.verify(token, jwtSecret);
            const editedUser = await user.findOne({ email: decoded.userId });
            
            if(!editedUser)
            {
                return res.status(404).json(makeError(['User not found.']));
            }
            

            const validPassword = await bcrypt.compare(currPw, editedUser.password);
            if(!validPassword)
            {
                //Invalid password.
                return res.status(400).json(makeError(['Invalid Password.']));
            }
            if(newPw && newPw != '')
            {
                if( newPw.length < 8)
                {
                    return res.status(400).json(makeError(['Passwords must be at least 8 characters long.']));
                }
                
            }
            const passHash = await bcrypt.hash(newPw, 10);
            editedUser.password = passHash;
            await editedUser.save();
    
            return res.status(200).json(makeResponse('success', false, ['New Password Saved Successfully.'], false));
    
        }catch(ex)
        {
            console.error(ex);
            res.status(400).json(makeError(['Something went wrong.']));
        }
    });

router.put('/toggleNotifications', authUser, async (req, res) =>
{
    try
    {
        const token = req.cookies.jwt;
        const decoded = jwt.verify(token, jwtSecret);
        const editedUser = await user.findOne({ email: decoded.userId });
        
        if(!editedUser)
        {
            return res.status(404).json(makeError(['User not found.']));
        }
        
        if(!editedUser.emailNotos)
        {
            editedUser.emailNotos = true;
        }
        else
        {
            editedUser.emailNotos = !editedUser.emailNotos;
        }

        await editedUser.save();

        return res.status(200).json(makeResponse('success', false, ['Updated your notifiation preferences!'], false));

    }catch(ex)
    {
        console.error(ex);
        res.status(400).json(makeError(['Something went wrong.']));
    }
});

// Get user orders with dereferenced item details
router.get('/orders', authUser, async (req, res) => {
    try {
        const userEmail = req.userId;
        
        // Find all orders for this user
        const orders = await Order.find({ customer: userEmail })
            .sort({ createdAt: -1 }) // Most recent first
            .lean();

        if (!orders || orders.length === 0) {
            return res.status(200).json(makeResponse('success', [], ['No orders found'], false));
        }

        // Dereference order items for each order
        const ordersWithDetails = await Promise.all(
            orders.map(async (order) => {
                const orderWithDetails = { ...order };
                
                // Dereference cues
                if (order.orderItems.cueGuids && order.orderItems.cueGuids.length > 0) {
                    const cues = await Cue.find({ 
                        guid: { $in: order.orderItems.cueGuids } 
                    }).select('guid cueNumber name price imageUrls -_id').lean();
                    
                    orderWithDetails.orderItems.cueDetails = cues;
                }

                // Dereference accessories
                if (order.orderItems.accessoryGuids && order.orderItems.accessoryGuids.length > 0) {
                    const accessoryGuids = order.orderItems.accessoryGuids.map(item => item.guid);
                    const accessories = await Accessory.find({ 
                        guid: { $in: accessoryGuids } 
                    }).select('guid accessoryNumber name price imageUrls -_id').lean();
                    
                    // Combine accessories with their quantities
                    orderWithDetails.orderItems.accessoryDetails = accessories.map(accessory => {
                        const orderItem = order.orderItems.accessoryGuids.find(item => item.guid === accessory.guid);
                        return {
                            ...accessory,
                            quantity: orderItem ? orderItem.quantity : 1
                        };
                    });
                }

                // Calculate total item count
                const cueCount = order.orderItems.cueGuids ? order.orderItems.cueGuids.length : 0;
                const accessoryCount = order.orderItems.accessoryGuids ? 
                    order.orderItems.accessoryGuids.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;
                
                orderWithDetails.totalItemCount = cueCount + accessoryCount;

                return orderWithDetails;
            })
        );

        return res.status(200).json(makeResponse('success', ordersWithDetails, ['Orders retrieved successfully'], false));

    } catch (ex) {
        console.error(ex);
        res.status(500).json(makeError(['Something went wrong while fetching orders.']));
    }
});

// Get a single user order by orderId with dereferenced item details
router.get('/orders/:orderId', authUser, async (req, res) => {
    try {
        const userEmail = req.userId;
        const { orderId } = req.params;

        // Find the order for this user
        const order = await Order.findOne({ orderId }).lean();

        if (!order) {
            return res.status(404).json(makeError(['Order not found'], false));
        }

        // Explicitly verify the order belongs to the JWT user
        if (order.customer !== userEmail) {
            return res.status(403).json(makeError(['You are not authorized to view this order'], false));
        }

        // Dereference cues
        if (order.orderItems.cueGuids && order.orderItems.cueGuids.length > 0) {
            const cues = await Cue.find({
                guid: { $in: order.orderItems.cueGuids }
            }).select('guid cueNumber name price imageUrls -_id').lean();
            order.orderItems.cueDetails = cues;
        }

        // Dereference accessories
        if (order.orderItems.accessoryGuids && order.orderItems.accessoryGuids.length > 0) {
            const accessoryGuids = order.orderItems.accessoryGuids.map(item => item.guid);
            const accessories = await Accessory.find({
                guid: { $in: accessoryGuids }
            }).select('guid accessoryNumber name price imageUrls -_id').lean();
            order.orderItems.accessoryDetails = accessories.map(accessory => {
                const orderItem = order.orderItems.accessoryGuids.find(item => item.guid === accessory.guid);
                return {
                    ...accessory,
                    quantity: orderItem ? orderItem.quantity : 1
                };
            });
        }

        // Calculate total item count
        const cueCount = order.orderItems.cueGuids ? order.orderItems.cueGuids.length : 0;
        const accessoryCount = order.orderItems.accessoryGuids ?
            order.orderItems.accessoryGuids.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;
        order.totalItemCount = cueCount + accessoryCount;

        return res.status(200).json(makeResponse('success', order, ['Order retrieved successfully'], false));
    } catch (ex) {
        console.error(ex);
        res.status(500).json(makeError(['Something went wrong while fetching the order.']));
    }
});
    
module.exports = router;