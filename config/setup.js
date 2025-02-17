const {dotenvConfig} = require('./envSetup');
const {connectToDB} = require('./mongoSetup'); 

dotenvConfig();
connectToDB();