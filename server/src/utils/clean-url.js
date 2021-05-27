const Juicer = require('url-juicer');

const { extractor } = Juicer;
const { parse } = Juicer.url;

module.exports = (url) => {
  if (!url) return '';
  const v = String(url).trim();
  const $ = extractor.cheerio(`<a href="${v}"></a>`);
  const href = $('a').attr('href');
  return parse(href).href;
};
