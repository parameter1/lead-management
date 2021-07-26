const { Router } = require('express');
const dayjs = require('dayjs');
const { iterateCursor } = require('@parameter1/mongodb/utils');
const asyncRoute = require('../utils/async-route');
const connection = require('../mongodb/connection');

const router = Router();

router.get('/', asyncRoute(async (req, res) => {
  await connection;
  const collection = connection.db.collection('exact-target-email-export');

  const cursor = await collection.find({}, {
    sort: {
      'client.slug': 1,
      'dataFolder.path': 1,
      slug: 1,
    },
    projection: {
      emailId: 1,
      entity: 1,
      'client.name': 1,
      'dataFolder.name': 1,
      name: 1,
      createdDate: 1,
      modifiedDate: 1,
    },
  });

  const headers = '<tr><th>Business Unit</th><th>Folder</th><th>Email Name</th><th>Created</th><th>Modified</th></tr>';

  const map = new Map();

  const html = ['<html><body>'];
  await iterateCursor(cursor, (doc) => {
    const { name: clientName } = doc.client;
    const { name: folderName } = doc.dataFolder;
    if (!map.has(clientName)) map.set(clientName, new Map());

    const clientMap = map.get(clientName);
    if (!clientMap.has(folderName)) clientMap.set(folderName, []);

    const emailArr = clientMap.get(folderName);
    emailArr.push(doc);

    // emailArr.push([
    //   doc.emailId,
    //   `<a href="/exact-target-email-export/${doc.entity}">${doc.name}</a>`,
    //   dayjs(doc.createdDate).format('YYYY-MM-DD HH:mm:ss'),
    //   dayjs(doc.modifiedDate).format('YYYY-MM-DD HH:mm:ss'),
    // ]);

    // rows.push(`<tr><td>${items.join('</td><td>')}</td></tr>`);
  });

  map.forEach((folders, bu) => {
    html.push(`<h2>${bu}</h2><hr>`);
    folders.forEach((emails, folder) => {
      html.push(`<h3>${folder}</h3><ul>`);
      emails.forEach((email) => {
        html.push(`<li><a href="/exact-target-email-export/${email.entity}">${email.name}</a> (ID: ${email.emailId})</li>`);
      });
      html.push('</ul>');
    });
    console.log(bu);
  });

  html.push('</body></html>');


  // const html = `<html><body><table border="1">${headers}${rows.join('')}</table></body></html>`;
  res.set('content-type', 'text/html');
  res.send(html.join(''));
}));

router.get('/:entity', asyncRoute(async (req, res) => {
  await connection;
  const collection = connection.db.collection('exact-target-email-export');

  const doc = await collection.findOne({ entity: req.params.entity }, { projection: { html: 1 } });
  if (!doc) throw new Error('No HTML found.');
  res.set('content-type', 'text/html');
  res.send(doc.html);
}));

module.exports = router;
