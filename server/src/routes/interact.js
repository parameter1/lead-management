const { Router } = require('express');
const noCache = require('nocache');
const cors = require('cors');
const bodyParser = require('body-parser');
const behaviorParser = require('../services/behavior-parser');
const asyncRoute = require('../utils/async-route');

const router = Router();
router.use(noCache());

const CORS = cors({
  origin: true,
  methods: ['POST'],
});

router.use(CORS);
router.options('*', CORS);

router.post('/', bodyParser.json(), asyncRoute(async (req, res, next) => {
  const { body } = req;
  let status = 200;
  const response = { ok: true };
  try {
    await behaviorParser.upsert(body).catch(next);
  } catch (e) {
    status = 500;
    response.err = e.message;
  }
  res.status(status).json(response);
}));

router.get('/', asyncRoute(async (req, res, next) => {
  const { d } = req.query;
  const json = d || null;

  let status = 200;
  const response = { ok: true };
  try {
    const body = JSON.parse(json);
    await behaviorParser.upsert(body).catch(next);
  } catch (e) {
    status = 500;
    response.err = e.message;
  }
  res.status(status).json(response);
}));

module.exports = router;
