const Joi = require('@parameter1/joi');

const unrealClickCodeProp = Joi.number().min(1).max(10);
const unrealClickCodesProp = Joi.array().items(unrealClickCodeProp);

const validators = {
  /** @type {ObjectSchema<BuildClickFilterParams>} */
  buildClickFilter: Joi.object({
    secondsSinceSentTime: Joi.object().pattern(
      Joi.number().integer().min(0).required(),
      Joi.object({
        allowUnrealCodes: unrealClickCodesProp,
      }).required(),
    ),
  }).default().label('buildClickFilter'),
};

const onlyRealClicks = () => ({ n: { $gt: 0 } });

/**
 * @param {UnrealClickCode[]} codes
 */
const onlyUnrealClicks = (codes) => ({ 'invalid.code': { $in: codes } });

/**
 * @param {UnrealClickCode[]} [codes]
 */
const realAndMaybeUnrealClicks = (codes) => {
  if (codes?.length) return { $or: [onlyRealClicks(), onlyUnrealClicks(codes)] };
  return onlyRealClicks();
};

/**
 * @param {BuildClickFilterParams} params
 */
const buildClickFilter = (params) => {
  /** @type {BuildClickFilterParams} */
  const { secondsSinceSentTime } = Joi.attempt(params, validators.buildClickFilter);

  if (secondsSinceSentTime) {
    // this is a hack to preserve the slightly incorrect querying of the legacy filter
    if (secondsSinceSentTime[0] && Object.keys(secondsSinceSentTime).length === 1) {
      const { allowUnrealCodes: codes = [] } = secondsSinceSentTime[0];
      if (codes.length === 1 && codes.includes(10)) {
        return {
          $or: [
            { 'invalid.0': { $exists: false } },
            { 'invalid.code': { $nin: [1, 2, 3, 4, 5, 6, 7, 8, 9] } },
          ],
        };
      }
      if (codes.every((code) => [1, 3, 10].includes(code))) {
        return {
          $or: [
            { 'invalid.0': { $exists: false } },
            { 'invalid.code': { $nin: [2, 4, 5, 6, 7, 8, 9] } },
          ],
        };
      }
    }

    const keys = Object.keys(secondsSinceSentTime);
    if (!keys.length) return onlyRealClicks();

    /** @type {{ seconds: number, allowUnrealCodes: undefined|UnrealClickCode[] }[]} */
    const configs = Object
      .keys(secondsSinceSentTime)
      .map((secs) => parseInt(secs, 10))
      .sort((a, b) => a - b)
      .reduce((array, seconds) => {
        if (!array.length && seconds !== 0) {
          // push a default 0 second range
          array.push({ seconds: 0 });
        }
        const config = secondsSinceSentTime[seconds];
        array.push({ seconds, ...config });
        return array;
      }, []);

    /** @type {{ range: [number, number|undefined], config: ClickFilterSecondsSinceSentTime }[]} */
    const ranges = configs.reduce((arr, { seconds, ...config }, index) => {
      const next = configs[index + 1];
      arr.push({
        range: next ? [seconds, next.seconds] : [seconds],
        config,
      });
      return arr;
    }, []);

    const $or = ranges.map(({ range, config }) => ({
      time: { $gte: range[0], ...(range[1] && { $lt: range[1] }) },
      ...realAndMaybeUnrealClicks(config.allowUnrealCodes),
    }));
    return { $or };
  }

  // only allow real clicks to be returned when no options have been provided.
  return onlyRealClicks();
};

module.exports = { buildClickFilter };

/**
 * @typedef BuildClickFilterParams
 * @prop {Record<number, ClickFilterSecondsSinceSentTime>} [secondsSinceSentTime] An object keyed by
 * the number of seconds to use as the threshold for etermining when a click should be treated as
 * valid.
 *
 * Clicks will be evaluated in two buckets: clicks occurring _up to and including_ the value and
 * clicks occurring _after_ the value. If more than one seconds property exists, the values are
 * applied in that range.
 *
 * @typedef ClickFilterSecondsSinceSentTime
 * @prop {UnrealClickCode[]} [allowUnrealCodes] The allowed unreal click codes to treat as
 * real when the click occurs _after_ the `seconds` threshold. An empty value discards all unreal
 * clicks.
 *
 * For example, if `seconds` is set to
 * `120` (two minutes) and the `allowUnrealCodesAfter` are set to `[1, 3]`, any unreal clicks with
 * codes 1 and 3 will be _included/allowed_ when clicked _more than_ 120 seconds after the
 * deployment time. Real clicks (clicks that did not have a reason code) will always be included.
 *
 * If the `seconds` parameter is `undefined` or `0`, the allowed codes, if any, are applied to all
 * clicks.
 *
 * @typedef {(1|2|3|4|5|6|7|8|9|10)} UnrealClickCode
 */

/**
 * @template T
 * @typedef {import("joi").ObjectSchema<T>} ObjectSchema
 */
