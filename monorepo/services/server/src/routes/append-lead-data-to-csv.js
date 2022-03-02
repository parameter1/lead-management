const { Router } = require('express');
const multer = require('multer');
const csvToJson = require('csvtojson');
const createError = require('http-errors');
const slug = require('slug');
const { get } = require('@parameter1/utils');
const { Parser } = require('json2csv');
const asyncRoute = require('../utils/async-route');
const micro = require('../micro');
const identityAttributes = require('../services/identity-attributes');

const router = Router();
const dev = process.env.NODE_ENV === 'development';

const attrMap = identityAttributes.reduce((map, { key: path, label }) => {
  if (path === 'emailAddress') return map;
  map.set(path, label);
  return map;
}, new Map());

const storage = multer.diskStorage({
  filename: (_, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}`);
  },
});
const upload = multer({ storage });

router.post('/', upload.single('file'), asyncRoute(async (req, res) => {
  const { file } = req;
  const { authorization } = req.headers;

  const rows = await csvToJson().fromFile(file.path);
  if (!rows || !rows.length) throw createError(400, 'Unable to find any rows in the provided file.');

  let fieldName;
  Object.keys(rows[0]).forEach((k) => {
    const cleaned = slug(k.trim()).replace(/-/g, '');
    if (/^email/.test(cleaned)) {
      if (fieldName) throw createError(400, 'More than one email column was found the provided file.');
      fieldName = k;
    }
  });
  if (!fieldName) throw createError(400, 'Unable to find an email column in the provided file.');
  const emails = rows.reduce((set, row) => {
    const value = row[fieldName].trim().toLowerCase();
    if (value) set.add(value);
    return set;
  }, new Set());

  const identities = await micro.exports.request('identity.export', { emails: [...emails] }, {
    headers: { authorization },
  });
  const identityMap = identities.reduce((map, doc) => {
    map.set(doc.emailAddress, doc);
    return map;
  }, new Map());

  const appended = rows.map((row) => {
    const r = { ...row };
    const email = row[fieldName];
    const identity = identityMap.get(email) || {};
    attrMap.forEach((label, path) => {
      const value = get(identity, path) || '';
      const k = `Leads ${label}`;
      r[k] = value;
    });
    return r;
  });

  let csv;
  if (rows.length) {
    const parser = new Parser({
      fields: Object.keys(appended[0]),
    });
    csv = parser.parse(appended);
  }
  const filename = `Appended - ${file.originalname}`;
  res.header('content-type', 'text/csv');
  res.header('x-filename', filename);
  res.attachment(filename);
  res.send(csv);
}));

// eslint-disable-next-line no-unused-vars
router.use((err, req, res, next) => {
  const { message, stack } = err;
  const status = err.statusCode || err.status || 500;
  const obj = { error: true, status, message };
  if (dev && stack) obj.stack = stack.split('\n');
  res.status(status).json(obj);
});

module.exports = router;
