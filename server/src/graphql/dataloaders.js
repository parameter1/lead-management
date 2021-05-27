const DataLoader = require('dataloader');

const Campaign = require('../models/campaign');
const Customer = require('../models/customer');
const EmailCategory = require('../models/email-category');
const EmailDeployment = require('../models/email-deployment');
const EmailSend = require('../models/email-send');
const ExcludedEmailDomain = require('../models/excluded-email-domain');
const ExtractedHost = require('../models/extracted-host');
const ExtractedUrl = require('../models/extracted-url');
const Form = require('../models/form');
const FormEntry = require('../models/form-entry');
const Identity = require('../models/identity');
const Order = require('../models/order');
const Tag = require('../models/tag');
const User = require('../models/user');
const Video = require('../models/video');

const createBatchFn = (Model) => async (ids) => {
  const docs = await Model.find({ _id: { $in: ids } });
  const map = docs.reduce((m, doc) => {
    m.set(`${doc._id}`, doc);
    return m;
  }, new Map());
  return ids.map((id) => map.get(`${id}`));
};

module.exports = {
  campaign: new DataLoader(createBatchFn(Campaign)),
  customer: new DataLoader(createBatchFn(Customer)),
  emailCategory: new DataLoader(createBatchFn(EmailCategory)),
  emailDeployment: new DataLoader(createBatchFn(EmailDeployment)),
  emailSend: new DataLoader(createBatchFn(EmailSend)),
  extractedHost: new DataLoader(createBatchFn(ExtractedHost)),
  extractedUrl: new DataLoader(createBatchFn(ExtractedUrl)),
  form: new DataLoader(createBatchFn(Form)),
  formEntry: new DataLoader(createBatchFn(FormEntry)),
  identity: new DataLoader(createBatchFn(Identity)),
  order: new DataLoader(createBatchFn(Order)),
  tag: new DataLoader(createBatchFn(Tag)),
  user: new DataLoader(createBatchFn(User)),
  video: new DataLoader(createBatchFn(Video)),

  excludedEmailDomains: new DataLoader(async (domains) => {
    const docs = await ExcludedEmailDomain.find({ domain: { $in: domains } });
    const map = docs.reduce((m, doc) => {
      m.set(doc.domain, doc);
      return m;
    }, new Map());
    return domains.map((domain) => map.get(domain));
  }),
};
