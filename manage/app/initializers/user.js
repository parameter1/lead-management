const name = 'user';

export function initialize(application) {
  application.inject('controller', name, `service:${name}`);
  application.inject('route', name, `service:${name}`);
  application.inject('component', name, `service:${name}`);
}

export default {
  name,
  initialize,
};
