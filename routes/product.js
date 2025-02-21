const express = require('express')
const Product = require('../models/product')
const router = express.Router()


router.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000") // update to match the domain you will make the request from
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
    res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, methods, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers")
    next()
});

//get all
router.get('/', async (req, res, next) => {
    try {
        const products = await Product.find()
        res.status(200).json(products)
    } catch (err) {
        res.status(500).json({message: err.message})
    }
})

//get one
router.get('/:id', getProduct, (req, res, next) => {
    res.send(res.product)
})

router.post('/', async (req, res, next) => {
    const product = new Product({
        prodId: req.body.prodId,
        listDate: req.body.listDate,
        availableDate: req.body.availableDate,
        price: req.body.price,
        tipMaterial: req.body.tipMaterial,
        tipSize: req.body.tipSize,
        ferruleMaterial: req.body.ferruleMaterial,
        shaftMaterial: req.body.shaftMaterial,
        collarMaterial: req.body.collarMaterial,
        jointPinSize: req.body.jointPinSize,
        jointPinMaterial: req.body.jointPinMaterial,
        jointCollarMaterial: req.body.jointCollarMaterial,
        forearmSize: req.body.forearmSize,
        forearmMaterial: req.body.forearmMaterial,
        forearmPointMaterial: req.body.forearmPointMaterial,
        veneerMatieral: req.body.veneerMatieral,
        handleMaterial: req.body.handleMaterial,
        buttSleeveSize: req.body.buttSleeveSize,
        buttSleeveMaterial: req.body.buttSleeveMaterial,
        buttSleeveVeneerMaterial: req.body.buttSleeveVeneerMaterial,
        buttCapMaterial: req.body.buttCapMaterial,
        bumperMaterial: req.body.bumperMaterial
    })

    try {
        const newProduct = await product.save()
        
        res.status(201).json(newProduct)
    } catch (err) {
        res.status(400).json({message: err.message})
    }
})

router.patch('/:id', getProduct, async (req, res, next) => {
    if(req.body.prodId != null)
    {
        res.product.prodId = req.body.prodId
    }
    if(req.body.listDate != null)
    {
        res.product.listDate = req.body.listDate
    }
    if(req.body.availableDate != null)
    {
        res.product.availableDate = req.body.availableDate
    }
    if(req.body.price != null)
    {
        res.product.price = req.body.price
    }
    if(req.body.tipMaterial != null)
    {
        res.product.tipMaterial = req.body.tipMaterial
    }
    if(req.body.tipSize != null)
    {
        res.product.tipSize = req.body.tipSize
    }
    if(req.body.ferruleMaterial != null)
    {
        res.product.ferruleMaterial = req.body.ferruleMaterial
    }
    if(req.body.shaftMaterial != null)
    {
        res.product.shaftMaterial = req.body.shaftMaterial
    }
    if(req.body.collarMaterial != null)
    {
        res.product.collarMaterial = req.body.collarMaterial
    }
    if(req.body.jointPinSize != null)
    {
        res.product.jointPinSize = req.body.jointPinSize
    }
    if(req.body.jointPinMaterial != null)
    {
        res.product.jointPinMaterial = req.body.jointPinMaterial
    }
    if(req.body.jointCollarMaterial != null)
    {
        res.product.jointCollarMaterial = req.body.jointCollarMaterial
    }
    if(req.body.forearmSize != null)
    {
        res.product.forearmSize = req.body.forearmSize
    }
    if(req.body.forearmMaterial != null)
    {
        res.product.forearmMaterial = req.body.forearmMaterial
    }
    if(req.body.forearmPointMaterial != null)
    {
        res.product.forearmPointMaterial = req.body.forearmPointMaterial
    }
    if(req.body.veneerMatieral != null)
    {
        res.product.veneerMatieral = req.body.veneerMatieral
    }
    if(req.body.handleMaterial != null)
    {
        res.product.handleMaterial = req.body.handleMaterial
    }
    if(req.body.buttSleeveSize != null)
    {
        res.product.buttSleeveSize = req.body.buttSleeveSize
    }
    if(req.body.buttSleeveMaterial != null)
    {
        res.product.buttSleeveMaterial = req.body.buttSleeveMaterial
    }
    if(req.body.buttSleeveVeneerMaterial != null)
    {
        res.product.buttSleeveVeneerMaterial = req.body.buttSleeveVeneerMaterial
    }
    if(req.body.buttCapMaterial != null)
    {
        res.product.buttCapMaterial = req.body.buttCapMaterial
    }
    if(req.body.bumperMaterial != null)
    {
        res.product.bumperMaterial = req.body.bumperMaterial
    }

    try {
        const updateProduct = await res.product.save()

        res.json({message: "Product updated successfully"})
    } catch (err) {
        res.status(400).json({message: err.message})
    }
})

router.delete('/:id', getProduct, async (req, res, next) => {
    try {
        await res.product.deleteOne()
        res.status(201).json({message: 'Successfully deleted product'})
    } catch (err) {
        res.status(500).json({message: err.message})
    }
})


async function getProduct(req, res, next) {
    let product
    try {
        product = await Product.findById(req.params.id)
        if(product == null){
            return res.status(404).json({ message: 'Cannot find appointment'})
        }
    } catch (err) {
        return res.status(500).json({ message: err.message})
    }

    res.product = product
    next()
}

module.exports = router