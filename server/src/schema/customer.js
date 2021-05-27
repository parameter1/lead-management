const { Schema } = require('mongoose');
const Juicer = require('url-juicer');
const externalSourcePlugin = require('../plugins/external-source');
const nameSlug = require('../utils/name-slug');
const importPlugin = require('../plugins/import');
const hashablePlugin = require('../plugins/hashable');

const schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  key: {
    type: String,
  },
  description: {
    type: String,
  },
  website: {
    type: String,
    trim: true,
    validate: {
      validator(v) {
        if (!v) return true;
        return Juicer.url.isValid(v);
      },
      message: 'The provided website URL is invalid {VALUE}',
    },
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'customer',
  },
  deleted: {
    type: Boolean,
    required: true,
    default: false,
  },
  gamAdvertiserIds: {
    type: [String],
    default: () => [],
  },
  brightcoveVideoIds: {
    type: [String],
    default: () => [],
  },
}, { timestamps: true });

schema.plugin(hashablePlugin);
schema.plugin(importPlugin);
schema.plugin(externalSourcePlugin, { required: false });

schema.index({ deleted: 1 });
schema.index({ name: 'text' });
schema.index({ key: 1 }, {
  unique: true,
  partialFilterExpression: { deleted: false },
});
schema.index({ name: 1, _id: 1 }, { unique: true });
schema.index({ name: -1, _id: -1 }, { unique: true });
schema.index({ updatedAt: 1, _id: 1 }, { unique: true });
schema.index({ updatedAt: -1, _id: -1 }, { unique: true });

schema.pre('save', function setKey(done) {
  this.key = nameSlug(this.name);
  done();
});

module.exports = schema;
