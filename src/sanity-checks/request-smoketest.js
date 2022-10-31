import crypto from 'node:crypto';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { CollectionsWrite } from '@tbd54566975/dwn-sdk-js';
import { DIDKey } from '../did/did-key';

const { did, privateJWK } = await DIDKey.generate();

const signatureInput = { 
  protectedHeader : { alg: privateJWK.alg, kid: privateJWK.kid },
  jwkPrivate      : privateJWK
};

const collectionsWriteMessage = await CollectionsWrite.create({
  target      : did,
  recipient   : did,
  schema      : 'CredentialApplication',
  recordId    : uuidv4(),
  nonce       : uuidv4(),
  data        : crypto.randomBytes(16),
  dateCreated : Date.now(),
  dataFormat  : 'application/json',
  signatureInput
});


const dwnRequest = {
  messages: [collectionsWriteMessage.message]
};

try {
  const resp = await axios.post('http://localhost:9000', dwnRequest);
  console.log(resp.status, resp.data);

} catch (e) {
  console.log(e);
}