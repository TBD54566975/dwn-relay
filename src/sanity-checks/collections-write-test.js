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
//     'eyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDprZXk6ejZNa3ViQWVua0dXYlNqR3F3R2RqdTZ2bVI5aVRNQ0N5eTRjOWtneVZVTUtScmhnIiwidHlwIjoiSldUIn0.eyJleHAiOjI1ODAxMzAwODAsImlzcyI6ImRpZDprZXk6ejZNa3ViQWVua0dXYlNqR3F3R2RqdTZ2bVI5aVRNQ0N5eTRjOWtneVZVTUtScmhnIiwianRpIjoiY2JiM2QwNjEtZDZkOS00ZTE4LThmMDYtZDkyZDQ2MjM5YTRmIiwibmJmIjoxNjY2MTk2NjY0LCJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSJdLCJpZCI6ImNiYjNkMDYxLWQ2ZDktNGUxOC04ZjA2LWQ5MmQ0NjIzOWE0ZiIsInR5cGUiOlsiVmVyaWZpYWJsZUNyZWRlbnRpYWwiXSwiaXNzdWVyIjoiZGlkOmtleTp6Nk1rdWJBZW5rR1diU2pHcXdHZGp1NnZtUjlpVE1DQ3l5NGM5a2d5VlVNS1JyaGciLCJpc3N1YW5jZURhdGUiOiIyMDIyLTEwLTE5VDE2OjI0OjI0WiIsImV4cGlyYXRpb25EYXRlIjoiMjA1MS0xMC0wNVQxNDo0ODowMC4wMDBaIiwiY3JlZGVudGlhbFN1YmplY3QiOnsiYWRkaXRpb25hbE5hbWUiOiJoYW5rIGhpbGwiLCJiaXJ0aERhdGUiOiIyMDA5LTAxLTAzIiwiZmFtaWx5TmFtZSI6InNpbXBzb24iLCJnaXZlbk5hbWUiOiJyaWNreSBib2JieSIsInBvc3RhbEFkZHJlc3MiOiJwIHNoZXJtYW4gNDIgd2FsbGFieSB3YXksIHN5ZG5leSIsInRheElEIjoiMTIzIn0sImNyZWRlbnRpYWxTY2hlbWEiOnsiaWQiOiJjMDYwZmRlYi0yOGQyLTQyNzItYjQwYS0yZDBiMzk2MjM0NGMiLCJ0eXBlIjoiSnNvblNjaGVtYVZhbGlkYXRvcjIwMTgifX19.vdgPFmV6cF0tESFSgIi-Rk_BoVA6nemf_Ko7bi2fpv3XgoOkSZzOZZA6DqeEJ1qpRPiOZxQuZJVF7rkiLd6aCQ'
//   ]
// };

const credApp = {
  'applicationJwt': 'eyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDprZXk6ejZNa3FlTXp2ekN3VVQ0YlQ5d2t5MUhmMUhHOWQ5WkpaRU0yMUZDeFd0MkFwb0x3IiwidHlwIjoiSldUIn0.eyJhbGciOiJFZERTQSIsImNyZWRlbnRpYWxfYXBwbGljYXRpb24iOnsiZm9ybWF0Ijp7Imp3dCI6eyJhbGciOlsiRWREU0EiXX19LCJpZCI6ImlkMTIzIiwibWFuaWZlc3RfaWQiOiI0MTVhNjkwZS1iZjY3LTRmMjktODcyOC1iY2I2NTM1ZjhiYjEiLCJwcmVzZW50YXRpb25fc3VibWlzc2lvbiI6eyJkZWZpbml0aW9uX2lkIjoiMzJmNTQxNjMtNzE2Ni00OGYxLTkzZDgtZmYyMTdiZGIwNjUzIiwiZGVzY3JpcHRvcl9tYXAiOlt7ImZvcm1hdCI6Imp3dF92YyIsImlkIjoia3ljMSIsInBhdGgiOiIkLnZlcmlmaWFibGVDcmVkZW50aWFsc1swXSJ9XSwiaWQiOiJwc2lkIn0sInNwZWNfdmVyc2lvbiI6Imh0dHBzOi8vaWRlbnRpdHkuZm91bmRhdGlvbi9jcmVkZW50aWFsLW1hbmlmZXN0L3NwZWMvdjEuMC4wLyJ9LCJpYXQiOjE2NjYzNjkxOTAsImlzcyI6ImRpZDprZXk6ejZNa3FlTXp2ekN3VVQ0YlQ5d2t5MUhmMUhHOWQ5WkpaRU0yMUZDeFd0MkFwb0x3Iiwia2lkIjoiZGlkOmtleTp6Nk1rcWVNenZ6Q3dVVDRiVDl3a3kxSGYxSEc5ZDlaSlpFTTIxRkN4V3QyQXBvTHciLCJ2ZXJpZmlhYmxlQ3JlZGVudGlhbHMiOlsiZXlKaGJHY2lPaUpGWkVSVFFTSXNJbXRwWkNJNkltUnBaRHByWlhrNmVqWk5hMmx4VGsxNWN6Vm9kbmRtZFhsaE1uYzNWblZGTVZGdlEycHBWbnBHZDBKalEybDBPSEIzWkVGQmNHMWhJaXdpZEhsd0lqb2lTbGRVSW4wLmV5SmxlSEFpT2pJMU9EQXhNekF3T0RBc0ltbHpjeUk2SW1ScFpEcHJaWGs2ZWpaTmEybHhUazE1Y3pWb2RuZG1kWGxoTW5jM1ZuVkZNVkZ2UTJwcFZucEdkMEpqUTJsME9IQjNaRUZCY0cxaElpd2lhblJwSWpvaU1UQmhZV1F6WmpBdFptTmxZUzAwTXpWa0xXSXlaakl0WTJRek16WTNOR1kzWmpsaElpd2libUptSWpveE5qWTJNelk1TVRnNUxDSnpkV0lpT2lKa2FXUTZhMlY1T25vMlRXdHBjVTVOZVhNMWFIWjNablY1WVRKM04xWjFSVEZSYjBOcWFWWjZSbmRDWTBOcGREaHdkMlJCUVhCdFlTSXNJblpqSWpwN0lrQmpiMjUwWlhoMElqcGJJbWgwZEhCek9pOHZkM2QzTG5jekxtOXlaeTh5TURFNEwyTnlaV1JsYm5ScFlXeHpMM1l4SWwwc0ltbGtJam9pTVRCaFlXUXpaakF0Wm1ObFlTMDBNelZrTFdJeVpqSXRZMlF6TXpZM05HWTNaamxoSWl3aWRIbHdaU0k2V3lKV1pYSnBabWxoWW14bFEzSmxaR1Z1ZEdsaGJDSmRMQ0pwYzNOMVpYSWlPaUprYVdRNmEyVjVPbm8yVFd0cGNVNU5lWE0xYUhaM1puVjVZVEozTjFaMVJURlJiME5xYVZaNlJuZENZME5wZERod2QyUkJRWEJ0WVNJc0ltbHpjM1ZoYm1ObFJHRjBaU0k2SWpJd01qSXRNVEF0TWpGVU1UWTZNVGs2TkRsYUlpd2laWGh3YVhKaGRHbHZia1JoZEdVaU9pSXlNRFV4TFRFd0xUQTFWREUwT2pRNE9qQXdMakF3TUZvaUxDSmpjbVZrWlc1MGFXRnNVM1ZpYW1WamRDSTZleUpoWkdScGRHbHZibUZzVG1GdFpTSTZJbWhoYm1zZ2FHbHNiQ0lzSW1KcGNuUm9SR0YwWlNJNklqSXdNRGt0TURFdE1ETWlMQ0ptWVcxcGJIbE9ZVzFsSWpvaWMybHRjSE52YmlJc0ltZHBkbVZ1VG1GdFpTSTZJbkpwWTJ0NUlHSnZZbUo1SWl3aWFXUWlPaUprYVdRNmEyVjVPbm8yVFd0cGNVNU5lWE0xYUhaM1puVjVZVEozTjFaMVJURlJiME5xYVZaNlJuZENZME5wZERod2QyUkJRWEJ0WVNJc0luQnZjM1JoYkVGa1pISmxjM01pT25zaVlXUmtjbVZ6YzBOdmRXNTBjbmtpT2lKVkxsTXVRU0lzSW1Ga1pISmxjM05NYjJOaGJHbDBlU0k2SWtGMWMzUnBiaUlzSW1Ga1pISmxjM05TWldkcGIyNGlPaUpVV0NJc0luQnZjM1JoYkVOdlpHVWlPaUkzT0RjeU5DSXNJbk4wY21WbGRFRmtaSEpsYzNNaU9pSXhNak1nU21GdWEzUnZjR2xoSUVGMlpTNGlmU3dpZEdGNFNVUWlPaUl4TWpNaWZTd2lZM0psWkdWdWRHbGhiRk5qYUdWdFlTSTZleUpwWkNJNklqZG1PVGhpWkRGa0xUaGpObUl0TkdVME9DMWlNall4TFRNeFltRXhNV00yTWpRNFl5SXNJblI1Y0dVaU9pSktjMjl1VTJOb1pXMWhWbUZzYVdSaGRHOXlNakF4T0NKOWZYMC5mQ1NmX1gzQ0wwSUplU2dSODVxdzNBcWpSM0c0TGlDRU1TSy1CRG9BV0tOT25xdzVvVGJuZnpCNGpLMzZNZ2ppbjhjdnhRc1IyUTltN2p3eklISHZBdyJdfQ.EkmR_Rhh9hK-3pjrhRxNeP4CRhXHbTJBQA91XWER465bOHZD4kTs2P2JduMBweKOxqlHueofdxhnvSM504_UDA'
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

console.log("Sending Request to DWN:")

console.log(JSON.stringify(dwnRequest))

try {
  const resp = await axios.post('http://localhost:9000', dwnRequest);
  console.log(resp.status, JSON.stringify(resp.data, null, 2));

} catch (e) {
  console.log(e);
}