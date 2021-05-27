(function mergeCustomers(db) {
  // eslint-disable-next-line no-undef
  const winner = ObjectId('58e7b3706e57f51f907f0321');
  const losers = [
    // eslint-disable-next-line no-undef
    ObjectId('5c8a79303f599d8433f1ef2a'),
  ];

  const locs = [
    'campaigns::customerId',
    'orders::customerId',
    'customer::parentId',
    'extracted-hosts::customerId',
    'extracted-urls::customerId',
    'forms::customerId',
  ];

  locs.forEach((l) => {
    const [coll, path] = l.split('::');
    db.getCollection(coll).update({
      [path]: { $in: losers },
    }, {
      $set: { customerId: winner },
    }, {
      multi: true,
    });
  });
  db.getCollection('customers').remove({ _id: { $in: losers } });
// eslint-disable-next-line no-undef
}(db));
