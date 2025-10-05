const mongoose = require("mongoose");
const { v4: uuidv4 } = require('uuid');

const cueSchema = new mongoose.Schema({
    // General Attributes
    guid: { type: String, default: uuidv4, unique: true },
    stripe_id: {type: String, required: false},
    cueNumber: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: false },
    overallWeight: { type: String, required: false },
    overallLength: { type: String, required: false },
    description: { type: String, required: false },
    notes: { type: String, required: false },
    status: { type: String, required: true },
    featured: { type: Boolean, default: false },

    // Shaft
    shaftMaterial: { type: String, required: false },
    shaftTaper: { type: String, required: false },
    tipSize: { type: String, required: false },
    ferruleMaterial: { type: String, required: false },

    // Butt - General Attributes
    buttWeight: { type: String, required: false },
    buttLength: { type: String, required: false },
    jointPinSize: { type: String, required: false },
    jointPinMaterial: { type: String, required: false },
    jointCollarMaterial: { type: String, required: false },
    buttCapMaterial: { type: String, required: false },

    // Butt - Forearm Attributes
    forearmMaterial: { type: String, required: false },
    forearmInlayQuantity: { type: Number, required: false },
    forearmInlaySize: { type: String, required: false },
    forearmInlayMaterial: { type: String, required: false },
    forearmInlayDescription: { type: String, required: false },
    forearmPointQuantity: { type: Number, required: false },
    forearmPointSize: { type: String, required: false },
    forearmPointVeneerDescription: { type: String, required: false },
    forearmPointInlayMaterial: { type: String, required: false },
    forearmPointInlayDescription: { type: String, required: false },

    // Butt - Handle Attributes
    handleMaterial: { type: String, required: false },
    handleWrapType: { type: String, required: false },
    handleWrapColor: { type: String, required: false },
    handleInlayQuantity: { type: Number, required: false },
    handleInlaySize: { type: String, required: false },
    handleInlayMaterial: { type: String, required: false },
    handleInlayDescription: { type: String, required: false },

    // Butt - Butt Sleeve Attributes
    buttSleeveMaterial: { type: String, required: false },
    buttsleeveInlayQuantity: { type: Number, required: false },
    buttsleeveInlaySize: { type: String, required: false },
    buttsleeveInlayDescription: { type: String, required: false },
    buttSleevePointQuantity: { type: Number, required: false },
    buttSleevePointSize: { type: String, required: false },
    buttSleeveInlayMaterial: { type: String, required: false },
    buttSleevePointVeneerDescription: { type: String, required: false },
    buttSleevePointInlayMaterial: { type: String, required: false },
    buttSleevePointInlayDescription: { type: String, required: false },

    // Rings
    ringType: { type: String, required: false },
    ringsDescription: { type: String, required: false },

    // Config Attributes
    isFullSplice: { type: Boolean, default: false },
    includeWrap: { type: Boolean, default: false },

    //images
    imageUrls: {type: [String], required: false},

    // Timestamps
    createdOn: { type: Date, default: Date.now },
    updatedOn: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Cue", cueSchema);