const jwt = require('jsonwebtoken');

function verifyJWT(req, res, next) {
    try {
        if(!req.headers.authorization) {
            return res.status(401).send('Missing JWT token!')
        } else {
            try {
                const token = req.headers.authorization.split(' ')[1];
                jwt.verify(token, global.env.JWTKEY); 
                next();
            } catch (error) {
                return res.status(401).send('Invalid JWT token!');
            }
        }
    }   
    catch (error) {
        return res.status(500).send(error.message);
    }
}

module.exports = {verifyJWT};