const express = require('express')
const Order = require('../../models/order')
const { makeError, makeResponse } = require('../../response/makeResponse');
const router = express.Router()
const { authUser , authAdmin } = require('../authorization')

router.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", process.env.ORIGIN_URL) // update to match the domain you will make the request from
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, methods, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers")
    next()
});

//get all
router.get('/', authAdmin, async (req, res, next) => {
    try {
        const orders = await Order.find()
        res.status(200).json(makeResponse('success', orders, ['fetched all orders from database'], false))
    } catch (err) {
        res.status(500).json(makeError([err.message]))
    }
})

//get one
router.get('/:id', authAdmin, getOrder, (req, res, next) => {
    res.send(makeResponse('success', [res.order], ['fetched 1 order from database with id: ' + req.params.id], false))
})

router.post('/', authAdmin, async (req, res, next) => {
    const order = new Order({
        customer: req.body.customer,
        orderStatus: req.body.orderStatus,
        totalAmount: req.body.totalAmount,
        currency: req.body.currency,
        paymentStatus: req.body.paymentStatus,
        paymentMethod: req.body.paymentMethod,
        shippingAddress: req.body.shippingAddress,
        billingAddress: req.body.billingAddress,
        expectedDelivery: req.body.expectedDelivery,
        orderItems: req.body.orderItems,
        createdAt: req.body.createdAt,
        updatedAt: req.body.updatedAt
    })

    try {
        const newOrder = await order.save()
        
        res.status(201).json(makeResponse('success', newOrder, ['created a new order in the database with order id: ' + order.orderId], false))
    } catch (err) {
        res.status(400).json(makeError([err.message]))
    }
})

router.patch('/:id', authAdmin, getOrder, async (req, res, next) => {
    if(req.body.customer != null)
    {
        res.order.customer = req.body.customer
    }
    if(req.body.orderStatus != null)
    {
        res.order.orderStatus = req.body.orderStatus
    }
    if(req.body.totalAmount != null)
    {
        res.order.totalAmount = req.body.totalAmount
    }
    if(req.body.currency != null)
    {
        res.order.currency = req.body.currency
    }
    if(req.body.paymentStatus != null)
    {
        res.order.paymentStatus = req.body.paymentStatus
    }
    if(req.body.paymentMethod != null)
    {
        res.order.paymentMethod = req.body.paymentMethod
    }
    if(req.body.shippingAddress != null)
    {
        res.order.shippingAddress = req.body.shippingAddress
    }
    if(req.body.billingAddress != null)
    {
        res.order.billingAddress = req.body.billingAddress
    }
    if(req.body.expectedDelivery != null)
    {
        res.order.expectedDelivery = req.body.expectedDelivery
    }
    if(req.body.orderItems != null)
    {
        res.order.orderItems = req.body.orderItems
    }
    if(req.body.updatedAt != null)
    {
        res.order.updatedAt = req.body.updatedAt
    }

    try {
        const updatedOrder = await res.order.save()

        res.json(makeResponse('success', updatedOrder, ['updated a order in the database with order id: ' + updatedOrder.orderId], false))
    } catch (err) {
        res.status(400).json(makeError([err.message]))
    }
})

router.delete('/:id', authAdmin, getOrder, async (req, res, next) => {
    try {
        await res.order.deleteOne()
        res.status(201).json(makeResponse('success', false, ['deleted a order in the database with database id: ' + req.params.id], false))
    } catch (err) {
        res.status(500).json(makeError([err.message]))
    }
})


async function getOrder(req, res, next) {
    let order
    try {
        order = await Order.findById(req.params.id)
        if(order === null){
            return res.status(404).json(makeError(['Cannot find order']))
        }
    } catch (err) {
        return res.status(500).json(makeError([err.message]))
    }

    res.order = order
    next()
}

module.exports = router