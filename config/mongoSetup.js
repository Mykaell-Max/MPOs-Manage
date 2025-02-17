const mongoose = require('mongoose');

async function connectToDB(){
    try {
        await mongoose.connect(global.env.MONGO); 
        console.log("Connected to Mongo database!");
    }
    catch (error) {
        console.log(error.message);
    }
};

module.exports = {connectToDB};