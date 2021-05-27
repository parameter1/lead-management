import { helper } from '@ember/component/helper';
import numeral from 'numeral';

export function format([value, postionalFormat], { format }) {
  return numeral(value).format(postionalFormat || format || '0.00a');
}

export default helper(format);
