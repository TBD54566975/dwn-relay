import fs from 'node:fs';
import config from '../config';

import { DIDKey } from './did-key';

let didConfig;

if (fs.existsSync(config.did.storagePath)) {
  const didConfigJson = fs.readFileSync(config.did.storagePath, { encoding: 'utf-8' });
  didConfig = JSON.parse(didConfigJson);
} else {
  if (config.did.method === 'key') {
    didConfig = await DIDKey.generate();
    fs.writeFileSync(config.did.storagePath, JSON.stringify(didConfig, null, 2));
  } else {
    throw new Error(`DID Method ${config.did.method} not supported`);
  }
}

export default didConfig;
