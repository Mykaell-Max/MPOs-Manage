const bcrypt = require('bcrypt');

const saltRounds = 10;

async function hashPassword(password) {
    try {
        const hash = await bcrypt.hash(password, saltRounds);
        return hash;    
    }  
    catch (error) {
        return error.message;
    }
}


async function comparePasswords(password, userPassword) {
    try {
        const result = await bcrypt.compare(password, userPassword);
        return result;
    } 
    catch (error) {
        return error.message;   
    }
}

module.exports = {hashPassword, comparePasswords};