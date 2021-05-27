const fetch = require('node-fetch');
const querystring = require('querystring');
const moment = require('moment-timezone');
const env = require('../env');

const {
  WUFOO_API_SUBDOMAIN,
  WUFOO_API_KEY,
  WUFOO_API_PASSWORD,
} = env;

const isEmpty = (v) => v === '' || v === undefined || v === null;
const { keys } = Object;
const { isArray } = Array;
const authHeader = Buffer.from(`${WUFOO_API_KEY}:${WUFOO_API_PASSWORD}`).toString('base64');

module.exports = {
  /**
   * Updates a Form document with Wufoo data for the provided identifier.
   *
   * @param {Form} document
   * @param {string} identifier
   */
  async setFormFields(document) {
    const { identifier } = document.externalSource;
    const form = await this.retrieveForm(identifier);

    document.set('name', form.Name);
    document.set('description', form.Description);
    document.set('externalSource.createdAt', moment.tz(form.DateCreated, 'America/Chicago').toDate());
    document.set('externalSource.updatedAt', moment.tz(form.DateUpdated, 'America/Chicago').toDate());
    document.set('externalSource.lastRetrievedAt', new Date());
    document.set('previewUrl', this.createFormUrl(WUFOO_API_SUBDOMAIN, identifier));

    const fields = await this.retrieveFormFields(identifier);
    const formatted = [];
    for (let i = 0; i < fields.length; i += 1) {
      const field = fields[i];
      const f = {};
      keys(field).forEach((key) => {
        const value = field[key];
        if (!isEmpty(value)) f[key] = value;
      });
      formatted.push(f);
    }
    document.set('fields', formatted);
  },

  /**
   * Retrieves form data from Wufoo.
   *
   * @param {string} identifier The Wufoo form identifier, e.g. `zweqc3x0v3szj4`
   */
  async retrieveForm(identifier) {
    const endpoint = `forms/${identifier}`;
    const body = await this.request('GET', endpoint);
    if (body && isArray(body.Forms)) {
      return body.Forms[0];
    }
    throw new Error(`Unable to parse form data for ID '${identifier}'.`);
  },

  /**
   * Retrieves form field data from Wufoo.
   *
   * @param {string} identifier The Wufoo form identifier, e.g. `zweqc3x0v3szj4`
   */
  async retrieveFormFields(identifier) {
    const endpoint = `forms/${identifier}/fields`;
    const body = await this.request('GET', endpoint);
    if (body && isArray(body.Fields)) {
      return body.Fields;
    }
    throw new Error(`Unable to parse form field data for ID '${identifier}'.`);
  },

  async retrieveFormEntries(identifier, params) {
    const endpoint = `forms/${identifier}/entries`;
    const body = await this.request('GET', endpoint, params);
    if (body && isArray(body.Entries)) {
      return body.Entries;
    }
    return [];
  },

  request(method, endpoint, params = {}, body) {
    const url = this.buildUrl(endpoint, params, 'json');

    const headers = { Authorization: `Basic ${authHeader}` };
    return fetch(url, { method, headers, body }).then((res) => {
      if (res.ok) return res.json();
      throw new Error(`Bad response from Wufoo API. ${method} '${res.url}' returned '${res.status}: ${res.statusText}'`);
    });
  },

  buildUrl(endpoint, params = {}, format = 'json') {
    let url = `${this.getBaseUri()}/${endpoint}.${format}`;
    const qs = querystring.stringify(params);
    if (qs) url = `${url}?${qs}`;
    return url;
  },

  getBaseUri() {
    return `https://${WUFOO_API_SUBDOMAIN}.wufoo.com/api/v3`;
  },

  /**
   * @param {string} subdomain
   * @param {string} identifier
   */
  createFormUrl(subdomain, identifier) {
    return `https://${subdomain}.wufoo.com/forms/${identifier}/`;
  },
};
