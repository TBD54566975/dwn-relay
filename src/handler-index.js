import config from './config';
import JankyIndex from './utils/janky-index';

const handlerIndex = new JankyIndex(['method', 'protocol', 'schema']);

console.log("putting handler index")
for (let handler of config.relay.handlers) {
  handlerIndex.put(handler.filter, handler);
}

export default handlerIndex;