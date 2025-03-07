const jwt = require('jsonwebtoken');

// this function will need extra logic to deal with the fact that operator cannot create and delete its own account
async function userAuth(req, res, next) {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const tokenUserId = jwt.verify(token, global.env.JWTKEY).userId;

        const reqUserId = req.params.userId;

        if (tokenUserId === reqUserId) {
            next();
        } else {
            return res.status(403).json({message: "You don't have permission!"});
        }
    } catch (error) {
        return res.status(500).json(error.message);
    }
};

module.exports = {userAuth};