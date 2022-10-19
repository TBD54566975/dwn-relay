import axios from 'axios';
import { ProtocolsConfigure } from '@tbd54566975/dwn-sdk-js';
import { DIDKey } from '../did/did-key';

const SSI_DID = 'did:key:z6MkpBmJNwPU7vubZWa9YBZU3EjW5SVnGhhjCJQFMYBW4V2E';
const { did: aliceDID, privateJWK } = await DIDKey.generate();

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

try {
  const resp = await axios.post('http://localhost:9000', { messages: [protocolsConfigureMessage] });
  console.log(resp.status, JSON.stringify(resp.data, null, 2));

} catch (e) {
  console.log(e);
}

