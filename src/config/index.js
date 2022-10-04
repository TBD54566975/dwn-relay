import fs from 'node:fs';

import mkdirp from 'mkdirp';
import merge from 'lodash/merge';

import defaults from './defaults';

// ensure that directory for all config and config-adjacent files exists
mkdirp.sync(defaults.relay.etcPath);

const configExists = fs.existsSync(defaults.config.path);
let { default: config = {} } = configExists && await import(defaults.config.path);

// deep-merge defaults and config
const mergedConfig = merge({}, defaults, config);

// TODO: consider providing env var overrides

export default mergedConfig;