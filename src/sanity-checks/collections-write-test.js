import axios from 'axios';
import { CollectionsWrite } from '@tbd54566975/dwn-sdk-js';
import { v4 as uuidv4 } from 'uuid';
import { DIDKey } from '../did/did-key';
import didConfig from '../did/did-loader';

const { did: aliceDID, privateJWK } = await DIDKey.generate();

const signatureInput = {
  protectedHeader : { alg: privateJWK.alg, kid: privateJWK.kid },
  jwkPrivate      : privateJWK
};

const credApp = {
  'id'           : 'c0c6e312-ad44-4f18-935e-a6efaad91612',
  'spec_version' : 'https://identity.foundation/credential-manifest/spec/v1.0.0/',
  'manifest_id'  : '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
  'format'       : {
    'jwt_vc': {
      'alg': [
        'EdDSA'
      ]
    }
  },
  'presentation_submission': {
    'id'             : '00239c16-3e64-4438-8dda-641e963fa853',
    'definition_id'  : '32f54163-7166-48f1-93d8-ff217bdb0653',
    'descriptor_map' : [
      {
        'id'     : 'kyc1',
        'format' : 'vc-jwt',
        'path'   : '$.verifiableCredential[0]'
      }
    ]
  },
  'verifiableCredential': [
    'eyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDprZXk6ejZNa3ViQWVua0dXYlNqR3F3R2RqdTZ2bVI5aVRNQ0N5eTRjOWtneVZVTUtScmhnIiwidHlwIjoiSldUIn0.eyJleHAiOjI1ODAxMzAwODAsImlzcyI6ImRpZDprZXk6ejZNa3ViQWVua0dXYlNqR3F3R2RqdTZ2bVI5aVRNQ0N5eTRjOWtneVZVTUtScmhnIiwianRpIjoiY2JiM2QwNjEtZDZkOS00ZTE4LThmMDYtZDkyZDQ2MjM5YTRmIiwibmJmIjoxNjY2MTk2NjY0LCJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSJdLCJpZCI6ImNiYjNkMDYxLWQ2ZDktNGUxOC04ZjA2LWQ5MmQ0NjIzOWE0ZiIsInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiXSwiaXNzdWVyIjoiZGlkOmtleTp6Nk1rdWJBZW5rR1diU2pHcXdHZGp1NnZtUjlpVE1DQ3l5NGM5a2d5VlVNS1JyaGciLCJpc3N1YW5jZURhdGUiOiIyMDIyLTEwLTE5VDE2OjI0OjI0WiIsImV4cGlyYXRpb25EYXRlIjoiMjA1MS0xMC0wNVQxNDo0ODowMC4wMDBaIiwiY3JlZGVudGlhbFN1YmplY3QiOnsiYWRkaXRpb25hbE5hbWUiOiJoYW5rIGhpbGwiLCJiaXJ0aERhdGUiOiIyMDA5LTAxLTAzIiwiZmFtaWx5TmFtZSI6InNpbXBzb24iLCJnaXZlbk5hbWUiOiJyaWNreSBib2JieSIsInBvc3RhbEFkZHJlc3MiOiJwIHNoZXJtYW4gNDIgd2FsbGFieSB3YXksIHN5ZG5leSIsInRheElEIjoiMTIzIn0sImNyZWRlbnRpYWxTY2hlbWEiOnsiaWQiOiJjMDYwZmRlYi0yOGQyLTQyNzItYjQwYS0yZDBiMzk2MjM0NGMiLCJ0eXBlIjoiSnNvblNjaGVtYVZhbGlkYXRvcjIwMTgifX19.vdgPFmV6cF0tESFSgIi-Rk_BoVA6nemf_Ko7bi2fpv3XgoOkSZzOZZA6DqeEJ1qpRPiOZxQuZJVF7rkiLd6aCQ'
  ]
};

// TODO: chuck credapp into a JWT
const credAppJson = JSON.stringify(credApp);
const credAppBytes = new TextEncoder().encode(credAppJson);

const credAppDwnMessage = await CollectionsWrite.create({
  contextId   : uuidv4(),
  data        : credAppBytes,
  dateCreated : Date.now(),
  dataFormat  : 'application/json',
  nonce       : uuidv4(),
  recipient   : didConfig.did,
  recordId    : uuidv4(),
  target      : didConfig.did,
  protocol    : 'https://identity.foundation/decentralized-web-node/protocols/credential-issuance',
  schema      : 'https://identity.foundation/credential-manifest/schemas/credential-application',
  signatureInput
});

const dwnRequest = {
  messages: [credAppDwnMessage.toObject()]
};

try {
  const resp = await axios.post('http://localhost:9000', dwnRequest);
  console.log(resp.status, JSON.stringify(resp.data, null, 2));

} catch (e) {
  console.log(e);
}