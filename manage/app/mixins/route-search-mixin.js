import Mixin from '@ember/object/mixin';
import RouteObservableMixin from 'leads-manage/mixins/route-observable-mixin';

export default Mixin.create(RouteObservableMixin, {
  /**
   *
   * @param {*} queryOptions
   * @param {*} params
   */
  async search({ query, resultKey, vars }, { searchBy, phrase, searchType, pagination }) {
    const search = { field: searchBy, phrase };
    const options = { position: searchType };
    const variables = { pagination, search, options, ...vars };

    this.getController().set('resultKey', resultKey);
    try {
      const response = await this.get('apollo').watchQuery({ query, variables, fetchPolicy: 'network-only' }, resultKey);
      this.getController().set('observable', this.getObservable(response));
      return response;
    } catch (e) {
      this.get('graphErrors').show(e)
    }
  },
});
