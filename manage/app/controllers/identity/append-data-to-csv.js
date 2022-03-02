import Controller from '@ember/controller';
import FormMixin from 'leads-manage/mixins/form-mixin';
import { inject } from '@ember/service';

export default Controller.extend(FormMixin, {
  session: inject(),

  actions: {
    /**
     *
     */
    async append(event) {
      this.startAction();
      const token = this.get('session.data.authenticated.session.token');
      try {
        event.preventDefault();
        const data = new FormData(event.target);
        const r = await fetch('/append-lead-data-to-csv', {
          method: 'POST',
          body: data,
          headers: { authorization: `Bearer ${token}` }
        });
        if (!r.ok) {
          const json = await r.json();
          if (json && json.message) throw new Error(json.message);
          throw new Error('A fatal error was encountered');
        }
        const filename = r.headers.get('x-filename');
        const blob = await r.blob();
        const href = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = href;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (e) {
        this.get('graphErrors').show(e);
      } finally {
        this.endAction();
      }
    },
  },
});
