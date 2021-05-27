const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const config = require('./config/environment');

// @see https://www.apollographql.com/docs/react/advanced/fragments.html

const host = process.env.GRAPH_URL || 'http://localhost:8288';
const environment = process.env.NODE_ENV || 'development';

const url = `${host}${config(environment).apollo.apiURL}`;

fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: `
      {
        __schema {
          types {
            kind
            name
            possibleTypes {
              name
            }
          }
        }
      }
    `,
  }),
}).then(result => result.json()).then(result => {
  // here we're filtering out any type information unrelated to unions or interfaces
  const filteredData = result.data.__schema.types.filter(
    type => type.possibleTypes !== null,
  );
  result.data.__schema.types = filteredData;
  fs.writeFile('./app/gql/fragment-types.json', JSON.stringify(result.data), err => {
    if (err) console.error('Error writing fragmentTypes file', err);
    console.log('Fragment types successfully extracted!');
  });
});
