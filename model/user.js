const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }


const UserSchema = new mongoose.Schema({
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: validateEmail,
        message: 'Invalid email format',
        },
    },
    password: {
      type: String,
      required: true,
    },
  });
  
  UserSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
      this.password = await bcrypt.hash(this.password, 10);
    }
    next();
  });
  
  UserSchema.methods.comparePassword = function (password) {
    return bcrypt.compare(password, this.password);
  };

const userModel = mongoose.model('User', UserSchema);

module.exports = userModel;
