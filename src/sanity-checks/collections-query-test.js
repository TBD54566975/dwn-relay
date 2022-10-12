import crypto from 'node:crypto';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { CollectionsQuery } from '@tbd54566975/dwn-sdk-js';
import { DIDKey } from '../did/did-key';

const { did, privateJWK } = await DIDKey.generate();

const signatureInput = { 
  protectedHeader : { alg: privateJWK.alg, kid: privateJWK.kid },
  jwkPrivate      : privateJWK
};

const collectionsQueryMessage = await CollectionsQuery.create({
  target : did,
  nonce  : uuidv4(),
  filter : {
    schema: 'https://somehost.com/CredentialManifest'
  },
  signatureInput
});


const dwnRequest = {
  messages: [collectionsQueryMessage.toObject()]
};

try {
  const resp = await axios.post('http://localhost:9000', dwnRequest);
  console.log(resp.status, JSON.stringify(resp.data, null, 2));

} catch (e) {
  console.log(e);
}