const FuelSoap = require('fuel-soap');
const parseIntParam = require('../utils/parse-int-param');

const { isArray } = Array;

const retrieve = (client, type, props, options) => new Promise((resolve, reject) => {
  client.retrieve(type, props, options, (err, res) => {
    if (err) {
      reject(err);
    } else {
      resolve(res.body);
    }
  });
});

class FuelInstance {
  /**
   *
   * @param {object} options
   * @param {object} secondaryOptions
   */
  constructor(options, secondaryOptions) {
    this.client = new FuelSoap(options);
    this.secondaryClient = new FuelSoap(secondaryOptions);
  }

  /**
   *
   * @async
   * @param {string} type
   * @param {?array} props
   * @param {?object} options
   */
  async retrieve(type, props, options) {
    const body = await retrieve(this.client, type, props, options);

    // Assume the body is good if there are results.
    const results = (body && isArray(body.Results)) ? body.Results : [];
    if (results.length) return body;

    // Otherwise, return using the secondary client;
    return retrieve(this.secondaryClient, type, props, options);
  }

  /**
   *
   * @async
   * @param {string} id
   * @param {?array} props
   */
  async retrieveChildDataFoldersFor(id, props = ['ID', 'Name', 'ParentFolder.ID']) {
    const parsed = FuelInstance.parseAndValidateId(id, 'retrieve DataFolder data');
    const filter = {
      leftOperand: 'ParentFolder.ID',
      operator: 'equals',
      rightOperand: parsed,
    };
    const body = await this.retrieve('DataFolder', props, { filter });
    const result = FuelInstance.formatBody(body, false);
    return result;
  }

  /**
   *
   * @async
   * @param {string} id
   * @param {?array} props
   */
  async retrieveDataFolderById(id, props = ['ID', 'ParentFolder.ID', 'Name']) {
    const parsed = FuelInstance.parseAndValidateId(id, 'retrieve DataFolder data');
    const filter = {
      leftOperand: 'ID',
      operator: 'equals',
      rightOperand: parsed,
    };
    const body = await this.retrieve('DataFolder', props, { filter });
    const result = FuelInstance.formatBody(body, true);
    if (!result) throw new Error(`No DataFolder found for ID '${parsed}'`);
    return result;
  }

  /**
   *
   * @async
   * @param {string} id
   * @param {array} tree
   */
  async retrieveDataFolderTree(id, tree = []) {
    const props = ['ID', 'ParentFolder.ID', 'Name'];
    const result = await this.retrieveDataFolderById(id, props);
    tree.push(result);
    if (result.ParentFolder && result.ParentFolder.ID && result.ParentFolder.ID !== '0') {
      await this.retrieveDataFolderTree(result.ParentFolder.ID, tree);
    }
    return tree.slice();
  }

  /**
   *
   * @async
   * @param {string|number} id
   * @param {?array} props
   */
  async retrieveEmailById(id, props = ['ID']) {
    const parsed = FuelInstance.parseAndValidateId(id, 'retrieve Email data');
    const filter = {
      leftOperand: 'ID',
      operator: 'equals',
      rightOperand: parsed,
    };
    const body = await this.retrieve('Email', props, { filter });
    const result = FuelInstance.formatBody(body, true);
    if (!result) throw new Error(`No Email found for ID '${parsed}'`);
    return result;
  }

  /**
   *
   * @async
   * @param {string|number} id
   * @param {?array} props
   */
  async retrieveSendById(id, props = ['ID']) {
    const parsed = FuelInstance.parseAndValidateId(id, 'retrieve Send data');
    const filter = {
      leftOperand: 'ID',
      operator: 'equals',
      rightOperand: parsed,
    };
    const body = await this.retrieve('Send', props, { filter });
    const result = FuelInstance.formatBody(body, true);
    if (!result) throw new Error(`No Send found for ID '${id}'`);
    return result;
  }

  /**
   *
   * @async
   * @param {string|number} emailId
   * @param {?array} props
   */
  async retrieveSendsByEmailId(emailId, props = ['ID', 'Email.ID']) {
    const parsed = FuelInstance.parseAndValidateId(emailId, 'retrieve Send data', 'Email.ID');
    const filter = {
      leftOperand: 'Email.ID',
      operator: 'equals',
      rightOperand: parsed,
    };
    const body = await this.retrieve('Send', props, { filter });
    return FuelInstance.formatBody(body, false);
  }

  /**
   *
   * @async
   * @param {string} email
   * @param {?array} props
   */
  async retrieveSubscriberByEmail(email, props = ['ID', 'EmailAddress']) {
    const filter = {
      leftOperand: 'EmailAddress',
      operator: 'equals',
      rightOperand: email,
    };
    const body = await this.retrieve('Subscriber', props, { filter });
    const result = FuelInstance.formatBody(body, true);
    if (!result) throw new Error(`No Subscriber found for EmailAddress '${email}'`);
    return result;
  }

  /**
   *
   * @async
   * @param {string|number} id
   * @param {?array} props
   */
  async retrieveSubscriberById(id, props = ['ID', 'EmailAddress']) {
    const parsed = FuelInstance.parseAndValidateId(id, 'retrieve Subscriber data');
    const filter = {
      leftOperand: 'ID',
      operator: 'equals',
      rightOperand: parsed,
    };
    const body = await this.retrieve('Subscriber', props, { filter });
    const result = FuelInstance.formatBody(body, true);
    if (!result) throw new Error(`No Subscriber found for ID '${id}'`);
    return result;
  }

  /**
   * Parses and validates an ID value.
   * If invalid, will throw an error with the corresponding action value.
   *
   * @param {*} id
   * @param {string} action
   */
  static parseAndValidateId(id, action, key = 'ID') {
    const parsed = parseIntParam(id);
    if (!parsed) throw new Error(`Unable to ${action}. The ${key} value of '${id}' is invalid.`);
    return parsed;
  }

  /**
   *
   * @param {object} body
   * @param {boolean} [asOne=false]
   */
  static formatBody(body, asOne = false) {
    const results = (body && isArray(body.Results)) ? body.Results.slice() : [];
    if (asOne) return results.shift();
    return results;
  }
}

module.exports = FuelInstance;
