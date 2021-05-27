import { helper } from '@ember/component/helper';
import moment from 'moment';

export function format([value, postionalFormat], { format }) {
  return moment(value.replace(/T.*$/, ''), 'YYYY-MM-DD').format(postionalFormat || format || 'MMM Do, YYYY');
}

export default helper(format);
