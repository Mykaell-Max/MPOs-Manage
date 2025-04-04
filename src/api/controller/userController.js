const { User } = require('../mongo/userModel');
const jwt = require('jsonwebtoken');

async function createUser(req, res) {
    try {
        const { name, email, password, roles, department, position, preferences } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ 
                success: false,
                message: 'User with this email already exists' 
            });
        }
        
        const newUser = new User({
            name,
            email,
            password,
            department,
            position,
            preferences,
            roles: roles || ['User'] 
        });
        
        if (roles && roles.length > 0) {
            const Role = require('../mongo/userModel').Role;
            const roleDetails = await Role.find({ name: { $in: roles } });
            
            newUser.roleDetails = roleDetails.map(role => ({
                name: role.name,
                description: role.description,
                permissions: role.permissions,
                isCustom: role.isCustom,
                createdBy: role.createdBy,
                createdAt: role.createdAt
            }));
        }
        
        const user = await newUser.save();

        return res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                roles: user.roles,
                department: user.department,
                position: user.position
            }
        });
    }
    catch (error) {
        console.error('Error creating user:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create user',
            error: error.message
        });
    }
}


async function loginUser(req, res) {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(403).json({ 
                success: false,
                message: 'Invalid email or password' 
            });
        }
        
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account is deactivated. Please contact an administrator.'
            });
        }
        
        const isMatch = await user.comparePassword(password);

        if (isMatch) {
            const payload = {
                userId: user._id,
                name: user.name,
                email: user.email,
                roles: user.roles
            };

            const token = jwt.sign(
                payload, 
                global.env.JWTKEY, 
                { expiresIn: '24h' }
            );
            
            user.lastLogin = new Date();
            await user.save();

            return res.status(200).json({
                success: true,
                message: "Logged in successfully",
                token: token,
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    roles: user.roles,
                    department: user.department,
                    position: user.position,
                    profileImage: user.profileImage,
                    preferences: user.preferences
                }
            });
        } else {
            return res.status(403).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
    } 
    catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({
            success: false, 
            message: 'Login failed',
            error: error.message
        });
    }
}


async function updateUser(req, res) {
    try {
        const userId = req.params.userId;
        const updates = req.body;
        
        if (updates.roles || updates.roleDetails) {
            return res.status(400).json({
                success: false,
                message: 'Role updates must be done through the role assignment endpoints'
            });
        }
        
        const user = await User.findByIdAndUpdate(
            userId, 
            updates, 
            { new: true, runValidators: true }
        );
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }
        
        return res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                roles: user.roles,
                department: user.department,
                position: user.position,
                isActive: user.isActive,
                lastLogin: user.lastLogin,
                profileImage: user.profileImage,
                preferences: user.preferences
            }
        });
    }
    catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update user',
            error: error.message
        });
    }
}


async function deleteUser(req, res) {
    try {
        const userId = req.params.userId;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found'
            });
        }
        
        user.isActive = false;
        await user.save();
        
        // for hard delete: await User.findByIdAndDelete(userId);
        
        return res.status(200).json({
            success: true,
            message: 'User deactivated successfully'
        });
    }
    catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: error.message
        });
    }
}


async function getUserProfile(req, res) {
    try {
        const userId = req.user._id; 
        
        const user = await User.findById(userId)
            .select('-password')
            .populate('manager', 'name email profileImage');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        return res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch user profile',
            error: error.message
        });
    }
}


async function setUserSubstitute(req, res) {
    try {
        const userId = req.params.userId;
        const { substituteId, startDate, endDate, reason, workflows } = req.body;
        
        if (!substituteId) {
            return res.status(400).json({
                success: false,
                message: 'Substitute user ID is required'
            });
        }
        
        const [user, substitute] = await Promise.all([
            User.findById(userId),
            User.findById(substituteId)
        ]);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        if (!substitute) {
            return res.status(404).json({
                success: false,
                message: 'Substitute user not found'
            });
        }
        
        user.substitutes.push({
            user: substituteId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            reason,
            active: true,
            workflows: workflows || []
        });
        
        await user.save();
        
        return res.status(200).json({
            success: true,
            message: 'Substitute assigned successfully',
            data: user.substitutes[user.substitutes.length - 1]
        });
    } catch (error) {
        console.error('Error setting substitute:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to set substitute',
            error: error.message
        });
    }
}


async function updateUserPreferences(req, res) {
    try {
        const userId = req.user._id; 
        const { preferences } = req.body;
        
        if (!preferences) {
            return res.status(400).json({
                success: false,
                message: 'Preferences object is required'
            });
        }
        
        const user = await User.findByIdAndUpdate(
            userId,
            { $set: { preferences } },
            { new: true }
        );
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        return res.status(200).json({
            success: true,
            message: 'User preferences updated successfully',
            data: user.preferences
        });
    } catch (error) {
        console.error('Error updating preferences:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update preferences',
            error: error.message
        });
    }
}

module.exports = {
    createUser,
    loginUser,
    updateUser, 
    deleteUser,
    getUserProfile,
    setUserSubstitute,
    updateUserPreferences
};