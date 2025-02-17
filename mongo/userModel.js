const mongoose = require('mongoose');
const { hashPassword } = require('../utils/hashPassword');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      maxlength: [12, 'O nome deve ter menos de 13 caracteres'],
      minlength: [3, 'O nome deve ter mais de 2 caracteres'],
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
      match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'E-mail inválido!']
    },

    password: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: false,
      trim: true,
      match: [/\(\d{2}\) \d{5}-\d{4}/, 'Número de telefone inválido!']
    },

    role: {
      type: String,
      required: true,
      enum: ['Operator', 'PCM']
    },

    createdAt: {
      type: Date,
      default: Date.now,
    }
  }
);


userSchema.pre('save', async function (next) {
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

userSchema.pre('findOneAndUpdate', hashPasswordMiddleware);
userSchema.pre('updateOne', hashPasswordMiddleware);

const User = mongoose.model('User', userSchema);
module.exports = User;
