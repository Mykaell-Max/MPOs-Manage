const jwt = require('jsonwebtoken');
const User = require('../mongo/userModel');


async function roleAuth(roles) {
    return async (req, res, next) => {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, global.env.JWTKEY);
            
            const user = await User.findById(decoded.userId);
            
            if (!user) {
                return res.status(401).json({ message: "Usuário não encontrado" });
            }
            
            req.user = {
                id: user._id,
                role: user.role,
                name: user.name
            };
            
            if (roles.includes(user.role) || user.role === "Admin") {
                next();
            } else {
                return res.status(403).json({ 
                    message: "Você não tem permissão para realizar esta ação" 
                });
            }
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    };
}


module.exports = { roleAuth };