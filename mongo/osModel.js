const mongoose = require("mongoose")

const osSchema = new mongoose.Schema({

    createdAt: {
        type: Date,
        default: Date.now,
    }
});

const Os = mongoose.model('Os', osSchema);

module.exports = Os;