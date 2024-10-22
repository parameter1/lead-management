import Service from '@ember/service';

export default Service.extend({
  init() {
    this._super(...arguments)

    this.set('recommended', new Set([1, 3, 10]));
    this.set('options', this.convertCodesToOptions([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]))
  },

  /**
   * @param {number[]} codes
   */
  convertCodesToOptions(codes) {
    const recommended = this.get('recommended');
    return ([...codes] || []).sort((a, b) => a - b).map((code) => recommended.has(code) ? `${code} (Recommended)` : `${code}`)
  },

  /**
   * @param {string[]} options
   */
  convertOptionsToCodes(options) {
    return (options || []).map((option) => parseInt(option.replace('(Recommended)').trim(), 10)).sort((a, b) => a - b);
  },
  getSetting(key, defaultValue = false) {
    const found = this.settings.find((s) => s.key === key);
    return found ? found.value : defaultValue;
  }
});
