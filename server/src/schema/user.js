const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const validator = require('validator');
const importPlugin = require('../plugins/import');
const gravatar = require('../utils/gravatar');

const { Schema } = mongoose;

const schema = new Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    validate: [
      {
        validator(email) {
          return validator.isEmail(email);
        },
        message: 'Invalid email address {VALUE}',
      },
    ],
  },
  deleted: {
    type: Boolean,
    default: false,
    required: true,
  },
  givenName: {
    type: String,
    required: true,
    trim: true,
  },
  familyName: {
    type: String,
    required: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  logins: {
    type: Number,
    default: 0,
    min: 0,
  },
  lastLoggedInAt: {
    type: Date,
  },
  role: {
    type: String,
    default: 'Restricted',
    required: true,
    enum: ['Restricted', 'Member', 'Administrator'],
  },
  photoURL: {
    type: String,
    trim: true,
    validate: {
      validator(v) {
        if (!v) return true;
        return validator.isURL(v, {
          protocols: ['http', 'https'],
          require_protocol: true,
        });
      },
      message: 'Invalid photo URL for {VALUE}',
    },
  },
}, {
  timestamps: true,
});

schema.plugin(importPlugin);

/**
 * Indexes
 */
schema.index({ name: 'text', givenName: 'text', familyName: 'text' });
schema.index({ deleted: 1 });
schema.index({ email: 1 }, {
  unique: true,
  partialFilterExpression: { deleted: false },
});

schema.index({ name: 1, _id: 1 }, { unique: true });
schema.index({ name: -1, _id: -1 }, { unique: true });
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });
schema.index({ updatedAt: -1, _id: -1 }, { unique: true });
schema.index({ email: 1, _id: 1 }, { unique: true });
schema.index({ email: -1, _id: -1 }, { unique: true });
schema.index({ givenName: 1, _id: 1 }, { unique: true });
schema.index({ givenName: -1, _id: -1 }, { unique: true });
schema.index({ familyName: 1, _id: 1 }, { unique: true });
schema.index({ familyName: -1, _id: -1 }, { unique: true });

/**
 * Hooks.
 */
schema.pre('save', function setPassword(next) {
  if (!this.isModified('password')) {
    next();
  } else {
    bcrypt.hash(this.password, 13).then((hash) => {
      this.password = hash;
      next();
    }).catch(next);
  }
});
schema.pre('save', function setPhotoURL(next) {
  if (!this.photoURL) {
    this.photoURL = gravatar(this.email);
  }
  next();
});

module.exports = schema;
