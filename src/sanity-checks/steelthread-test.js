import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { CollectionsQuery, CollectionsWrite } from '@tbd54566975/dwn-sdk-js';
import * as jose from 'jose';
import { DIDKey } from '../did/did-key';
import didConfig from '../did/did-loader';

const getManifests = async () => {
  console.log('\nStart Get Manifests Collections Query\n');
  const { did, privateJWK } = await DIDKey.generate();

  const signatureInput = {
    protectedHeader : { alg: privateJWK.alg, kid: privateJWK.kid },
    jwkPrivate      : privateJWK,
  };

  const collectionsQueryMessage = await CollectionsQuery.create({
    target : did,
    nonce  : uuidv4(),
    filter : {
      schema: 'https://somehost.com/CredentialManifest',
    },
    signatureInput,
  });

  const dwnRequest = {
    messages: [collectionsQueryMessage.toObject()],
  };

  console.log('Sending Request to DWN:');
  console.log(JSON.stringify(dwnRequest));

  let resp;
  try {
    resp = await axios.post('http://localhost:9000', dwnRequest);

    console.log('\nCollections Query DWN Message Response:\n');
    console.log(resp.status, JSON.stringify(resp.data, null, 2));


    console.log('\nCollections Query Decoded Data:\n');
    console.log(atob(resp.data.replies[0].entries[0].encodedData));

  } catch (e) {
    console.log(e);
  }

  return resp;
};

const submitApplication = async (getManifestsResp) => {
  console.log('\nStart Submit Application Collections Write\n');

  const getManifestsDecodedData = atob(getManifestsResp.data.replies[0].entries[0].encodedData);
  const getManifestsDecodedDataJson = JSON.parse(getManifestsDecodedData);


  console.log('\n HERE \n');
  console.log(getManifestsDecodedDataJson.manifests[0].credential_manifest);

  const { did, privateJWK } = await DIDKey.generate();

  const signatureInput = {
    protectedHeader : { alg: privateJWK.alg, kid: privateJWK.kid },
    jwkPrivate      : privateJWK,
  };

  const header = {
    alg : 'EdDSA',
    kid : did,
    typ : 'JWT'
  };
  const payload = {
    'exp' : 2580130080,
    'iss' : did,
    'jti' : 'b7901f6d-bd08-4dd5-af3a-089cbd142fc5',
    'nbf' : 1666726474,
    'sub' : did,
    'vc'  : {
      '@context': [
        'https://www.w3.org/2018/credentials/v1'
      ],
      'id'   : 'b7901f6d-bd08-4dd5-af3a-089cbd142fc5',
      'type' : [
        'VerifiableCredential'
      ],
      'issuer'            : did,
      'issuanceDate'      : '2022-10-25T19:34:34Z',
      'expirationDate'    : '2051-10-05T14:48:00.000Z',
      'credentialSubject' : {
        'additionalName' : 'hank hill',
        'birthDate'      : '2009-01-03',
        'familyName'     : 'simpson',
        'givenName'      : 'ricky bobby',
        'id'             : did,
        'postalAddress'  : {
          'addressCountry'  : 'U.S.A',
          'addressLocality' : 'Austin',
          'addressRegion'   : 'TX',
          'postalCode'      : '78724',
          'streetAddress'   : '123 Janktopia Ave.'
        },
        'taxID': '123'
      },
      'credentialSchema': {
        'id'   : 'b2e7d174-2c90-4cc2-94f0-f7b3167f574f',
        'type' : 'JsonSchemaValidator2018'
      }
    }
  };

  const privateKey = await jose.importJWK(privateJWK, 'EdDSA');

  const personalInfoVc = await new jose.SignJWT(payload)
    .setProtectedHeader(header)
    .setIssuedAt()
    .setIssuer(did)
    .sign(privateKey);

  // TODO: Dynamically Create VC
  const credAppReq = {
    alg                    : 'EdDSA',
    credential_application : {
      format: {
        jwt: {
          alg: ['EdDSA'],
        },
      },
      id                      : 'id123',
      manifest_id             : getManifestsDecodedDataJson.manifests[0].credential_manifest.id,
      presentation_submission : {
        definition_id  : getManifestsDecodedDataJson.manifests[0].credential_manifest.presentation_definition.id,
        descriptor_map : [
          {
            format : 'jwt_vc',
            id     : 'kyc1',
            path   : '$.verifiableCredentials[0]',
          },
        ],
        id: 'psid',
      },
      spec_version:
        'https://identity.foundation/credential-manifest/spec/v1.0.0/',
    },
    kid                   : did,
    verifiableCredentials : [
      personalInfoVc
    ],
  };

  console.log('\n HERE 2\n');
  console.log(credAppReq);
  const ecPublicKey = await jose.importJWK(privateJWK, 'EdDSA');

  const jwt = await new jose.SignJWT(credAppReq)
    .setProtectedHeader({ alg: privateJWK.alg, kid: did, typ: 'JWT' })
    .setIssuedAt()
    .setIssuer(did)
    .sign(ecPublicKey);

  let credApp = {
    applicationJwt: jwt,
  };

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
    protocol    :
      'https://identity.foundation/decentralized-web-node/protocols/credential-issuance',
    schema:
      'https://identity.foundation/credential-manifest/schemas/credential-application',
    signatureInput,
  });

  const dwnRequest = {
    messages: [credAppDwnMessage.toObject()],
  };

  console.log('Sending Request to DWN:');
  console.log(JSON.stringify(dwnRequest));

  let resp;
  try {
    resp = await axios.post('http://localhost:9000', dwnRequest);
    console.log('\nCollections Write DWN Message Response:\n');
    console.log(resp.status, JSON.stringify(resp.data, null, 2));

    console.log('\nCollections Write Decoded Data:\n');
    console.log(atob(resp.data.replies[0].entries[0].encodedData));

  } catch (e) {
    console.log(e);
  }

  return resp;
};

const isValidGetManifestResponse = (getManifestsResp) => {
  if (getManifestsResp.status != 200) {
    return false;
  }

  const decodedData = atob(getManifestsResp.data.replies[0].entries[0].encodedData);
  const decodedDataJson = JSON.parse(decodedData);

  if (decodedData == undefined) {
    return false;
  }

  if(decodedDataJson.manifests[0].id.length < 1) {
    return false;
  }

  return true;
};

const isValidSubmitApplicationResponse = (submitApplicationResp) => {
  if (submitApplicationResp.status != 200 || submitApplicationResp.status != 200) {
    return false;
  }

  const decodedData = atob(submitApplicationResp.data.replies[0].entries[0].encodedData);
  const decodedDataJson = JSON.parse(decodedData);

  if (decodedData == undefined) {
    return false;
  }

  if(decodedDataJson.credential_response.id.length < 1) {
    return false;
  }

  if(decodedDataJson.verifiableCredentials.length < 1) {
    return false;
  }

  return true;
};

const getManifestsResp = await getManifests();
const submitApplicationResp = await submitApplication(getManifestsResp);


if (!isValidGetManifestResponse(getManifestsResp)) {
  throw new Error('Get Manifest Response is not valid');
}

if(!isValidSubmitApplicationResponse(submitApplicationResp)) {
  throw new Error('Submit Application Response is not valid');
}
