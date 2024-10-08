const Joi = require('@parameter1/joi');

const unrealClickCodeProp = Joi.number().min(1).max(10);
const unrealClickCodesProp = Joi.array().items(unrealClickCodeProp);

const validators = {
  /** @type {ObjectSchema<BuildClickFilterParams>} */
  buildClickFilter: Joi.object({
    allowedUnrealCodes: unrealClickCodesProp,
    usingClicksSinceSentTime: Joi.object({
      allowedUnrealCodesAfter: unrealClickCodesProp,
      allowedUnrealCodesBefore: unrealClickCodesProp,
      seconds: Joi.number().integer().min(0),
    }),
  }).default().max(1),
};

const onlyRealClicks = () => ({ n: { $gt: 0 } });

/**
 * @param {UnrealClickCode[]} codes
 */
const onlyUnrealClicks = (codes) => ({ 'invalid.code': { $in: codes } });

/**
 * @param {UnrealClickCode[]} [codes]
 */
const realOrMaybeUnrealClicks = (codes) => {
  if (codes?.length) return { $or: [onlyRealClicks(), onlyUnrealClicks(codes)] };
  return onlyRealClicks();
};

/**
 * @param {BuildClickFilterParams} params
 */
const buildClickFilter = (params) => {
  /** @type {BuildClickFilterParams} */
  const {
    allowedUnrealCodes,
    usingClicksSinceSentTime,
  } = Joi.attempt(params, validators.buildClickFilter);

  if (allowedUnrealCodes) {
    // allow real clicks or, optionally, unreal clicks with the specified codes
    return realOrMaybeUnrealClicks(allowedUnrealCodes);
  }

  if (usingClicksSinceSentTime) {
    return {
      $or: [
        // include valid clicks after the seconds threshold
        {
          // click must occur after the threshold
          time: { $gt: usingClicksSinceSentTime.seconds },
          // allow real clicks or, optionally, unreal clicks with the specified codes
          ...realOrMaybeUnrealClicks(usingClicksSinceSentTime.allowedUnrealCodesAfter),
        },
        // include valid clicks before the seconds threshold
        {
          // click must occur before and up-to the threshold
          time: { $lte: usingClicksSinceSentTime.seconds },
          // allow real clicks or, optionally, unreal clicks with the specified codes
          ...realOrMaybeUnrealClicks(usingClicksSinceSentTime.allowedUnrealCodesBefore),
        },
      ],
    };
  }

  // only allow real clicks to be returned when no options have been provided.
  return onlyRealClicks();
};

module.exports = { buildClickFilter };

/**
 * @typedef BuildClickFilterParams
 * @prop {UnrealClickCode[]} [allowedUnrealCodes] The allowed unreal click codes to treat as real.
 * If an empty array, no unreal clicks will be allowed in the results. Any codes in this array will
 * be treated as real and _included/allowed_ in results.
 * @prop {BuildClickFilterTimeParams} [usingClicksSinceSentTime] Uses seconds since a click occured
 * after the deployment sent time to determine which clicks should be deemed valid.
 *
 * @typedef BuildClickFilterTimeParams
 * @prop {boolean} [discardRealClicksBefore] If set to `true`, will discard real clicks before the
 * `seconds` threshold.
 * @prop {UnrealClickCode[]} [allowedUnrealCodesAfter] The allowed unreal click codes to treat as
 * real when the click occurs _after_ the `seconds` threshold. An empty value discards all unreal
 * clicks.
 *
 * For example, if `seconds` is set to
 * `120` (two minutes) and the `allowedUnrealCodesAfter` are set to `[1, 3]`, any unreal clicks with
 * codes 1 and 3 will be _included/allowed_ when clicked _more than_ 120 seconds after the
 * deployment time. Real clicks (clicks that did not have a reason code) will always be included.
 * @prop {UnrealClickCode[]} [allowedUnrealCodesBefore] The allowed unreal click codes to treat as
 * real when the click occurs _before_ the `seconds` threshold. An empty value discards all unreal
 * clicks.
 *
 * For example, if `seconds` is set to
 * `120` (two minutes) and the `allowedUnrealCodesAfter` are set to `[1, 3]`, any unreal clicks with
 * codes 1 and 3 will be _included/allowed_ when clicked _up to and including_ 120 seconds after
 * the deployment time. Real clicks (clicks that did not have a reason code) will still be included.
 * @prop {number} seconds The number of seconds to use as the threshold for determining when a click
 * should be treated as valid. Clicks will be evaluated in two buckets: clicks occurring _up to and
 * including_ the value and clicks occurring _after_ the value
 *
 * @typedef {(1|2|3|4|5|6|7|8|9|10)} UnrealClickCode
 */

/**
 * @template T
 * @typedef {import("joi").ObjectSchema<T>} ObjectSchema
 */
