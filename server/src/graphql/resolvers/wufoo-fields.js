const { isArray } = Array;

const common = {
  id: ({ ID }) => ID,
  title: ({ Title }) => Title,
};

const choices = {
  choices: ({ Choices }) => {
    if (isArray(Choices)) return Choices.map((c) => c.Label);
    return [];
  },
};

const subFields = {
  subFields: ({ SubFields }) => {
    if (isArray(SubFields)) return SubFields;
    return [];
  },
};

const typeResolver = ({ Type }) => {
  const suffix = Type.charAt(0).toUpperCase() + Type.slice(1);
  return `Wufoo${suffix}Field`;
};

module.exports = {
  /**
   *
   */
  WufooFormField: {
    __resolveType: typeResolver,
  },
  WufooChoicesField: {
    __resolveType: typeResolver,
  },
  WufooSubFieldField: {
    __resolveType: typeResolver,
  },

  WufooSubField: {
    id: ({ ID }) => ID,
    label: ({ Label }) => Label,
    default: ({ DefaultVal }) => DefaultVal,
  },

  WufooAddressField: { ...common, ...subFields },
  WufooCheckboxField: {
    ...common,
    ...choices,
    ...subFields,
    choices: ({ SubFields }) => {
      if (isArray(SubFields)) return SubFields.map((f) => f.Label);
      return [];
    },
  },
  WufooDateField: { ...common },
  WufooEmailField: { ...common },
  WufooFileField: { ...common },
  WufooLikertField: { ...common },
  WufooMoneyField: { ...common },
  WufooNumberField: { ...common },
  WufooPhoneField: { ...common },
  WufooRadioField: { ...common, ...choices },
  WufooRatingField: { ...common },
  WufooSelectField: { ...common, ...choices },
  WufooShortnameField: { ...common, ...subFields },
  WufooTextField: { ...common },
  WufooTextareaField: { ...common },
  WufooTimeField: { ...common },
  WufooUrlField: { ...common },
};
