const dotenv = require("dotenv");

function dotenvConfig(){
    try {
        dotenv.config();
        global.env = process.env
        console.log("Environment configured");
    } catch (error) {
        console.log(error.message);
    }
};

module.exports = {dotenvConfig}