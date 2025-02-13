const mongoose = require('mongoose');
const {hashPassword} = require('../utils/hashPassword');

const operatorSchema = new mongoose.Schema(
  {
    name:{
        type: String,
        required: true,
        maxlength: [12, 'O nome tem que ter menos de 13 caracteres'],
        minlength: [3, 'O nome tem que ter mais de 2 caracteres'],
        trim: true
        },

    lastName: {
        type: String,
        required: false,
        trim: true
        },
    
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid e-mail!']
        },

    password: {
        type: String,
        required: true,
    },

    phone: {
        type: String,
        required: false,
        trim: true,
        match: [/\(\d{2}\) \d{5}-\d{4}/, 'Invalid phone number!']
    },

    createdAt: {
        type: Date,
        default: Date.now,
    }
});


operatorSchema.pre('save', async function(next) {
    if (this.isModified('password') || this.isNew) {
        try {
            this.password = await hashPassword(this.password);
            next();
        } catch (err) {
            next(err);
        }
    } else {
        next();
    }
});

async function hashPasswordMiddleware(next) {
    const update = this.getUpdate();
    if (update.password) {
        try {
            update.password = await hashPassword(update.password);
            this.setUpdate(update);
            next();
        } catch (err) {
            next(err);
        }
    } else {
        next();
    }
}

operatorSchema.pre('findOneAndUpdate', hashPasswordMiddleware);
operatorSchema.pre('updateOne', hashPasswordMiddleware);

const Operator = mongoose.model('Operator', operatorSchema);
module.exports = Operator;