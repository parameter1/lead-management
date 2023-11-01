const { Router } = require('express');
const multer = require('multer');
const csvToJson = require('csvtojson');
const createError = require('http-errors');
const slug = require('slug');
const asyncRoute = require('../utils/async-route');

const router = Router();
const dev = process.env.NODE_ENV === 'development';

const storage = multer.diskStorage({
  filename: (_, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}`);
  },
});
const upload = multer({ storage });

router.post('/', upload.single('file'), asyncRoute(async (req, res) => {
  const { file } = req;

  const rows = await csvToJson().fromFile(file.path);
  if (!rows || !rows.length) throw createError(400, 'Unable to find any rows in the provided file.');

  let fieldName;
  Object.keys(rows[0]).forEach((k) => {
    const cleaned = slug(k.trim()).replace(/-/g, '');
    if (/^suppress$/.test(cleaned)) {
      if (fieldName) throw createError(400, 'More than one suppress column was found the provided file.');
      fieldName = k;
    }
  });
  if (!fieldName) throw createError(400, 'Unable to find a suppress column in the provided file.');
  const suppressions = rows.reduce((set, row) => {
    let value = row[fieldName].trim().toLowerCase();
    if (value) {
      // Opted for the "crudest" e-mail RegEx, there is NOT a "good" RegEx for this purpose
      if (value.match(/^.+?@.+?\..+$/)) set.add(value);
      if (value.match(/^http(s?):\/\//)) value = value.replace(/^http(s?):\/\//, '');
      if (value.match(/^mailto:/)) value = value.replace(/^mailto:/, '');
      if (value.match(/www\./)) value = value.replace(/www\./, '');
      if (value) set.add(value.split('/').slice(0, 1).pop());
    }
    return set;
  }, new Set());

  res.header('content-type', 'application/json');
  res.send(JSON.stringify({
    key: 'emailAddress',
    label: 'Email',
    matchType: 'contains',
    terms: Array.from(suppressions),
  }));
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
