const { URL } = require('url');
const cheerio = require('cheerio');

module.exports = (url) => {
  if (!url) return '';
  const v = `${url}`.trim();
  const $ = cheerio.load(`<a href="${v}"></a>`);
  const href = $('a').attr('href');
  return (new URL(href)).href;
};
