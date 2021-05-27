const objectPath = require('object-path');
const moment = require('moment-timezone');
const Fuel = require('../fuel/client');
const EmailSend = require('../models/email-send');

const { keys } = Object;
const SEND_NAMESPACE = 'FuelSOAP:Send';

const attrMap = {
  FromAddress: 'fromEmail',
  FromName: 'fromName',
  Subject: 'subject',
  PreviewURL: 'url',
  Status: 'status',
  EmailName: 'name',
  NumberSent: 'metrics.sent',
  NumberDelivered: 'metrics.delivered',
  UniqueOpens: 'metrics.uniqueOpens',
  UniqueClicks: 'metrics.uniqueClicks',
  Unsubscribes: 'metrics.unsubscribes',
  ForwardedEmails: 'metrics.forwards',
};

module.exports = {
  /**
   * Determines if an EmailSend document exists for the provided external ID.
   *
   * @param {string} id
   */
  async sendExistsFor(id) {
    if (!id) return false;
    return EmailSend.countDocuments({
      'externalSource.namespace': SEND_NAMESPACE,
      'externalSource.identifier': String(id),
    });
  },

  async findSendFor(id) {
    if (!id) return null;
    return EmailSend.findOne({
      'externalSource.namespace': SEND_NAMESPACE,
      'externalSource.identifier': String(id),
    });
  },

  /**
   * Upserts an EmailSend document using an ExactTarget Send object.
   *
   * @async
   * @param {string|number} jobId
   * @param {EmailDeployment} deployment
   */
  async upsertSendFor(jobId, deployment) {
    const send = await this.retrieveSend(jobId);
    const { ID } = send;
    if (send.Email.ID !== deployment.externalSource.identifier) {
      throw new Error(`The Deployment ID '${deployment.externalSource.identifier}' does not match the Send's Email.ID '${send.Email.ID}'`);
    }

    const criteria = {
      'externalSource.namespace': SEND_NAMESPACE,
      'externalSource.identifier': String(ID),
    };
    const $setOnInsert = {
      deploymentId: deployment.id,
      ...criteria,
    };
    const $set = this.mapSendData(send);
    if ($set.subject.match(/^test send/i) || $set.subject.match(/^\[test\]:/i)) {
      $set.isTestSend = true;
    } else {
      $set.isTestSend = false;
    }

    $set.rollupMetrics = deployment.rollupMetrics;

    $set['externalSource.lastRetrievedAt'] = new Date();
    $set['externalSource.createdAt'] = moment.tz(send.CreatedDate, 'America/Denver').toDate();
    $set['externalSource.updatedAt'] = moment.tz(send.ModifiedDate, 'America/Denver').toDate();
    $set.sentDate = moment.tz(send.SentDate, 'America/Denver').toDate();

    const bounces = send.HardBounces || 0 + send.SoftBounces || 0 + send.OtherBounces || 0;
    $set['metrics.bounces'] = bounces;

    return EmailSend.findOneAndUpdate(criteria, {
      $setOnInsert,
      $set,
    }, { upsert: true, new: true, runValidators: true });
  },

  /**
   * Maps ExactTarget Send object data to EmailSend model data.
   *
   * @param {object} send
   */
  mapSendData(send) {
    const mapped = {};
    keys(attrMap).forEach((theirKey) => {
      const ourKey = attrMap[theirKey];
      const value = objectPath.get(send, theirKey);
      if (value) mapped[ourKey] = value;
    });
    return mapped;
  },

  /**
   * Retrieves a Send record from ExactTarget.
   *
   * @param {string} id
   */
  retrieveSend(id) {
    const props = [].concat(
      ['ID', 'Email.ID', 'SentDate', 'CreatedDate', 'ModifiedDate', 'HardBounces', 'SoftBounces', 'OtherBounces'],
      Object.keys(attrMap),
    );
    return Fuel.retrieveSendById(id, props);
  },
};
