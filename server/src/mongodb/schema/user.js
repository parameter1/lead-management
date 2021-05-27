const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const validator = require('validator');

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
}, {
  timestamps: true,
});

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
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });
schema.index({ email: 1, _id: 1 }, { unique: true });
schema.index({ givenName: 1, _id: 1 }, { unique: true });
schema.index({ familyName: 1, _id: 1 }, { unique: true });

/**
 * Hooks.
 */
schema.pre('save', async function setPassword() {
  if (!this.isModified('password')) return;
  const { hash } = await bcrypt.hash(this.password, 13);
  this.password = hash;
});

module.exports = schema;
