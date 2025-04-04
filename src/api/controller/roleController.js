const { Role, User } = require('../mongo/userModel');
const mongoose = require('mongoose');


exports.createRole = async (req, res) => {
  try {
    const { name, description, permissions, isCustom } = req.body;
    
    if (!name || !permissions) {
      return res.status(400).json({
        success: false,
        message: 'Role name and permissions are required'
      });
    }
    
    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(409).json({
        success: false,
        message: 'A role with this name already exists'
      });
    }
    
    const role = new Role({
      name,
      description,
      permissions,
      isCustom: isCustom !== undefined ? isCustom : true,
      createdBy: req.user._id,
      createdAt: new Date()
    });
    
    await role.save();
    
    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: role
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create role',
      error: error.message
    });
  }
};


exports.getAllRoles = async (req, res) => {
  try {
    const roles = await Role.find()
      .populate('createdBy', 'name email');
    
    res.status(200).json({
      success: true,
      count: roles.length,
      data: roles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve roles',
      error: error.message
    });
  }
};


exports.assignRoleToUser = async (req, res) => {
  try {
    const { userId, roleName } = req.body;
    
    if (!userId || !roleName) {
      return res.status(400).json({
        success: false,
        message: 'User ID and role name are required'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const role = await Role.findOne({ name: roleName });
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }
    
    if (user.roles.includes(roleName)) {
      return res.status(400).json({
        success: false,
        message: 'User already has this role'
      });
    }
    
    user.roles.push(roleName);
    
    if (!user.roleDetails.some(r => r.name === roleName)) {
      user.roleDetails.push({
        name: role.name,
        description: role.description,
        permissions: role.permissions,
        isCustom: role.isCustom,
        createdBy: role.createdBy,
        createdAt: role.createdAt
      });
    }
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: `Role '${roleName}' assigned to user successfully`,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email
        },
        roles: user.roles
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to assign role',
      error: error.message
    });
  }
};


exports.removeRoleFromUser = async (req, res) => {
  try {
    const { userId, roleName } = req.body;
    
    if (!userId || !roleName) {
      return res.status(400).json({
        success: false,
        message: 'User ID and role name are required'
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID'
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (!user.roles.includes(roleName)) {
      return res.status(400).json({
        success: false,
        message: 'User does not have this role'
      });
    }
    
    user.roles = user.roles.filter(r => r !== roleName);
    
    user.roleDetails = user.roleDetails.filter(r => r.name !== roleName);
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: `Role '${roleName}' removed from user successfully`,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email
        },
        roles: user.roles
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to remove role',
      error: error.message
    });
  }
};

