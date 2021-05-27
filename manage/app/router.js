import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  this.route('login');
  this.route('dashboard', function() {
    this.route('fulfilled');
    this.route('archived');
  });
  this.route('reports', function() {
    this.route('line-items', { path: 'line-items/:hash' }, function() {
      this.route('email', function() {
        this.route('metrics', { path: '/' });
        this.route('leads');
        this.route('activity');
        this.route('export');
      });
      this.route('form', function() {

      });
    });
  });
  this.route('lead-report', { path: 'lead-report/:hash' }, function() {
    this.route('email', { path: '/'}, function() {
      this.route('metrics', { path: '/' });
      this.route('leads');
      this.route('activity');
      this.route('export');
    });
    this.route('forms', function() {
      this.route('submissions', { path: ':form_id' });
    });
    this.route('ads', function() {
      this.route('leads', { path: '/' });
      this.route('export');
    });
    this.route('ad-metrics');
    this.route('video-metrics');
    this.route('disabled');
  });
  this.route('link', function() {
    this.route('tracking', function() {
      this.route('ad-creatives', function() {
        this.route('create');
        this.route('edit', { path: ':id' });
      });
    });
    this.route('urls', function() {
      this.route('edit', { path: ':id' }, function() {
        this.route('email-sends');
      });
    });
    this.route('hosts');
  });
  this.route('customer', function() {
    this.route('list', { path: '' }, function() {
      this.route('gam-advertisers', function() {
        this.route('link', { path: ':company_id' })
      });
    });
    this.route('edit', { path: ':id' });
    this.route('create');
  });
  this.route('identity', function() {
    this.route('view', { path: ':id' });
    this.route('excluded-domains', function() {
      this.route('edit', { path: ':excluded_domain_id' });
      this.route('create');
    })
  });
  this.route('order', function() {
    this.route('edit', { path: ':id' }, function() {
      this.route('line-items', function() {
        this.route('email', function() {
          this.route('create');
          this.route('edit', { path: ':line_item_id' }, function() {
            this.route('leads', function() {
              this.route('index');
              this.route('deactivated');
            });
            this.route('deployments');
            this.route('qualifications');
            this.route('details');
          });
        });
        this.route('form', function() {
          this.route('create');
          this.route('edit', { path: ':line_item_id' }, function() {
            this.route('details');
            this.route('leads', function() {
              this.route('index');
              this.route('deactivated');
            });
            this.route('qualifications');
          });
        });
        this.route('video', function() {
          this.route('create');
          this.route('edit', { path: ':line_item_id' });
        });
      });
    });
    this.route('create');
  });
  this.route('campaign', function() {
    this.route('edit', { path: ':id' }, function() {
      this.route('email', function() {
        this.route('links');
        this.route('identities');
      });
      this.route('forms', function() {
        this.route('submissions', { path: ':form_id' });
      });
      this.route('ads', function() {
        this.route('trackers');
        this.route('identities');
      });
      this.route('ad-metrics', function() {

      });
      this.route('video-metrics', function() {

      });
    });
    this.route('create');
  });
  this.route('tracked-campaign', function() {
    this.route('create');
  });
  this.route('tag', function() {
    this.route('edit', { path: ':id' });
    this.route('create');
  });
  this.route('user', function() {
    this.route('edit', { path: ':id' });
    this.route('create');
  });
  this.route('email', function() {
    this.route('deployment', function() {
      this.route('view', { path: ':id' });
    });
    this.route('send', function() {
      this.route('view', { path: ':id' }, function() {
        this.route('urls');
      });
    });
    this.route('category', function() {
      this.route('view', { path: ':id' });
    });
    this.route('reporting');
    this.route('click-events');
  });
  this.route('video', function() {
    this.route('edit', { path: ':id' });
  });
  this.route('form', function() {
    this.route('edit', { path: ':id' }, function() {
      this.route('entries');
    });
    this.route('create');
  });
  this.route('behavior', function() {
    this.route('edit', { path: ':id/edit' });
    this.route('view', { path: ':id' }, function() {
      this.route('run');
      this.route('results', function() {
        this.route('rows', { path: ':result_id' }, function() {
          this.route('exports');
        });
      });
    });
    this.route('create');
  });
});

export default Router;
