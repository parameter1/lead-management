/**
 * @param {array} array
 * @param {number} size
 * @param {function} mapper
 * @param {function} formatter
 */
module.exports = (array, size, mapper, formatter) => {
  const chunked = [];
  let index = 0;
  while (index < array.length) {
    const slice = array.slice(index, size + index);
    const mapped = mapper ? slice.map(mapper) : slice;
    const formatted = formatter ? formatter(mapped) : mapped;
    chunked.push(formatted);
    index += size;
  }
  return chunked;
};
