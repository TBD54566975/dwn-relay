import axios from 'axios';
import { CollectionsWrite, ProtocolsConfigure, DWN } from '@tbd54566975/dwn-sdk-js';
import { v4 as uuidv4 } from 'uuid';
import { DIDKey } from '../did/did-key';

const SSI_DID = 'did:key:z6MkpBmJNwPU7vubZWa9YBZU3EjW5SVnGhhjCJQFMYBW4V2E';
const { did: aliceDID, privateJWK } = await DIDKey.generate();

const dwn = await DWN.create({});


const signatureInput = {
  protectedHeader : { alg: privateJWK.alg, kid: privateJWK.kid },
  jwkPrivate      : privateJWK
};

const protocolsConfigureMessage = await ProtocolsConfigure.create({
  target     : SSI_DID,
  protocol   : 'https://identity.foundation/decentralized-web-node/protocols/credential-issuance',
  definition : {
    'labels': {
      'credentialApplication': {
        'schema': 'https://identity.foundation/credential-manifest/schemas/credential-application'
      },
      'credentialResponse': {
        'schema': 'https://identity.foundation/credential-manifest/schemas/credential-response'
      }
    },
    'records': {
      'credentialApplication': {
        'allow': {
          'anyone': {
            'to': ['write']
          }
        },
        'records': {
          'credentialResponse': {
            'allow': {
              'recipient': {
                'of' : 'credentialApplication',
                'to' : ['write']
              }
            }
          }
        }
      }
    }
  },
  signatureInput
});
const resp = await dwn.processRequest({ messages: [protocolsConfigureMessage] });
console.log(JSON.stringify(resp, null, 2));

// const credApp = {
//   'id'           : 'c0c6e312-ad44-4f18-935e-a6efaad91612',
//   'spec_version' : 'https://identity.foundation/credential-manifest/spec/v1.0.0/',
//   'manifest_id'  : '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
//   'format'       : {
//     'jwt_vc': {
//       'alg': [
//         'EdDSA'
//       ]
//     }
//   },
//   'presentation_submission': {
//     'id'             : '00239c16-3e64-4438-8dda-641e963fa853',
//     'definition_id'  : '32f54163-7166-48f1-93d8-ff217bdb0653',
//     'descriptor_map' : [
//       {
//         'id'     : 'kyc1',
//         'format' : 'vc-jwt',
//         'path'   : '$.verifiableCredential[0]'
//       }
//     ]
//   },
//   'verifiableCredential': [
//     'eyJraWQiOiJkaWQ6amFua3k6YWxpY2UjZGlkOmphbmt5OmFsaWNlIiwiYWxnIjoiRWREU0EifQ.eyJpc3MiOiJkaWQ6amFua3k6YWxpY2UiLCJzdWIiOiJkaWQ6amFua3k6YWxpY2UiLCJ2YyI6eyJAY29udGV4dCI6WyJodHRwczpcL1wvd3d3LnczLm9yZ1wvMjAxOFwvY3JlZGVudGlhbHNcL3YxIl0sInR5cGUiOlsiS3ljQ3JlZGVudGlhbCJdLCJpc3N1ZXIiOiJkaWQ6amFua3k6YWxpY2UiLCJpc3N1YW5jZURhdGUiOiIyMDIyLTA5LTI5VDAwOjAwOjAwWiIsImNyZWRlbnRpYWxTY2hlbWEiOnsiaWQiOiJodHRwczpcL1wvY29tcGxpYW5jZS1pcy1rZXdsLmNvbVwvanNvbi1zY2hlbWFzXC9reWMuanNvbiIsInR5cGUiOiJKc29uU2NoZW1hVmFsaWRhdG9yMjAxOCJ9LCJjcmVkZW50aWFsU3ViamVjdCI6eyJpZCI6ImRpZDpqYW5reTphbGljZSIsImdpdmVuTmFtZSI6IlJhbmR5IiwiYWRkaXRpb25hbE5hbWUiOiJOXC9BIiwiZmFtaWx5TmFtZSI6Ik1jSmFua3kiLCJiaXJ0aERhdGUiOiIxOTg4LTAzLTI4IiwicG9zdGFsQWRkcmVzcyI6eyJhZGRyZXNzQ291bnRyeSI6IlVTQSIsImFkZHJlc3NMb2NhbGl0eSI6IkF1c3RpbiIsImFkZHJlc3NSZWdpb24iOiJUWCIsInBvc3RhbENvZGUiOiI3ODcyNCIsInN0cmVldEFkZHJlc3MiOiIxMjMgSmFua3RvcGlhIEF2ZS4ifSwidGF4SUQiOiIxMjMtNDUtNjc4OSJ9fX0.OIga_ix7x4Tk4fEThfu_akXCVuI0aZ770CSSztSJ1NkBiGm4V_NOSQRk0EOo3heh6F6LiK9g9sa_527rNH_wCw'
//   ]
// };

// // TODO: chuck credapp into a JWT
// const credAppJson = JSON.stringify(credApp);
// const credAppBytes = new TextEncoder().encode(credAppJson);

// const credAppDwnMessage = await CollectionsWrite.create({
//   contextId   : uuidv4(),
//   data        : credAppBytes,
//   dateCreated : Date.now(),
//   dataFormat  : 'application/json',
//   nonce       : uuidv4(),
//   recipient   : SSI_DID,
//   recordId    : uuidv4(),
//   target      : aliceDID,
//   protocol    : 'CredentialIssuance',
//   schema      : 'https://base64url-is-the-answer-to-everything.com/CredentialApplication',
//   signatureInput
// });

// const dwnRequest = {
//   messages: [credAppDwnMessage.toObject()]
// };

// try {
//   const resp = await axios.post('http://localhost:9000', dwnRequest);
//   console.log(resp.status, JSON.stringify(resp.data, null, 2));

// } catch (e) {
//   console.log(e);
// }