import Route from '@ember/routing/route';

export default Route.extend({
  /**
   *
   * @param {object} params
   */
  model() {
    const params = new URLSearchParams(window.location.search);

    let clickFilterRules = [];
    if (params.has('customClickFilter')) {
      const query = Object.fromEntries(params);

      clickFilterRules = Object.keys(query).filter((key) => {
        if (!/\d+/.test(key)) return false;
        return parseInt(key, 10) >= 0;
      })
      .map((secs) => parseInt(secs, 10))
      .sort((a, b) => a - b)
      .map((seconds) => ({
        seconds,
        allowUnrealCodes: query[seconds].split(',').filter((v) => v),
      }));

      if (!clickFilterRules.find((entry) => entry.seconds === 0)) {
        clickFilterRules.unshift({ seconds: 0, allowUnrealCodes: [] });
      }
    }

    return {
      campaign: this.modelFor('lead-report'),
      clickFilterRules,
      hasCustomClickFilter: params.has('customClickFilter'),
    };
  },
});
