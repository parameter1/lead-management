const namespace = require('../utils/entity-namespace');
const BehaviorEntity = require('../models/behavior/entity');
const { stringify, dasherize } = require('../utils/inflector');
const BehaviorView = require('../models/behavior/view');

module.exports = {
  async upsert(payload) {
    if (typeof payload !== 'object') throw new Error('No behavior payload was provided');
    const { usr, ent } = payload;
    if (!usr) throw new Error('The `usr` payload is invalid.');
    if (!ent) throw new Error('The `ent` payload is invalid.');

    const entity = this.createEntity(ent);
    const user = this.createEntity(usr);

    await this.upsertEntity(entity);
    await this.upsertEntity(user);

    const view = new BehaviorView({
      usr: user.key,
      ent: entity.key,
      last: new Date(),
    });
    await view.aggregateSave();
  },

  createEntity(ent) {
    const obj = typeof ent === 'object' ? ent : {};
    const { id } = obj;
    const ns = this.parseNamespace(obj.ns);

    return new BehaviorEntity({
      key: `${id}*${namespace.toString(ns)}`,
      cid: stringify(id),
      ns,
    });
  },

  /**
   *
   * @param {BehaviorEntity} entity
   */
  async upsertEntity(entity) {
    await entity.validate();
    const {
      key,
      cid,
      ns,
    } = entity;

    const criteria = { key };
    const $setOnInsert = { key, cid, ns };
    const update = { $setOnInsert };

    return BehaviorEntity.updateOne(criteria, update, { upsert: true });
  },

  parseNamespace(ns) {
    if (typeof ns !== 'object') return {};
    const { z, b, n } = ns;
    return {
      z: dasherize(z),
      b: dasherize(b),
      n: dasherize(n),
    };
  },
};
