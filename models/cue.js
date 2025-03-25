const mongoose = require("mongoose");

const cueSchema = new mongoose.Schema({
    // General Attributes
    cueNumber: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: String, required: true },
    overallWeight: { type: String, required: false },
    overallLength: { type: String, required: false },
    description: { type: String, required: false },
    notes: { type: String, required: false },
    status: { type: String, required: true },

    // Shaft
    shaftMaterial: { type: String, required: true },
    shaftTaper: { type: String, required: false },
    tipSize: { type: String, required: true },
    ferruleMaterial: { type: String, required: true },

    // Butt - General Attributes
    buttWeight: { type: String, required: false },
    buttLength: { type: String, required: false },
    jointPinSize: { type: String, required: true },
    jointPinMaterial: { type: String, required: true },
    jointCollarMaterial: { type: String, required: true },
    buttCapMaterial: { type: String, required: true },

    // Butt - Forearm Attributes
    forearmMaterial: { type: String, required: true },
    forearmInlayQuantity: { type: String, required: false },
    forearmInlaySize: { type: String, required: false },
    forearmInlayDescription: { type: String, required: false },
    forearmPointQuantity: { type: String, required: false },
    forearmPointSize: { type: String, required: false },
    forearmPointVeneerDescription: { type: String, required: false },
    forearmPointInlayDescription: { type: String, required: false },

    // Butt - Handle Attributes
    handleMaterial: { type: String, required: true },
    handleWrapType: { type: String, required: false },
    handleWrapColor: { type: String, required: false },
    handleInlayQuantity: { type: String, required: false },
    handleInlaySize: { type: String, required: false },
    handleInlayDescription: { type: String, required: false },

    // Butt - Butt Sleeve Attributes
    buttSleeveMaterial: { type: String, required: true },
    buttsleeveInlayQuantity: { type: String, required: false },
    buttsleeveInlaySize: { type: String, required: false },
    buttsleeveInlayDescription: { type: String, required: false },
    buttSleevePointQuantity: { type: String, required: false },
    buttSleevePointSize: { type: String, required: false },
    buttSleevePointVeneerDescription: { type: String, required: false },
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