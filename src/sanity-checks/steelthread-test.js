import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { CollectionsQuery, CollectionsWrite } from "@tbd54566975/dwn-sdk-js";
import { DIDKey } from "../did/did-key";
import didConfig from "../did/did-loader";
import * as jose from "jose";

const getManifests = async () => {
  console.log("\nStart Get Manifests Collections Query\n");
  const { did, privateJWK } = await DIDKey.generate();

  const signatureInput = {
    protectedHeader: { alg: privateJWK.alg, kid: privateJWK.kid },
    jwkPrivate: privateJWK,
  };

  const collectionsQueryMessage = await CollectionsQuery.create({
    target: did,
    nonce: uuidv4(),
    filter: {
      schema: "https://somehost.com/CredentialManifest",
    },
    signatureInput,
  });

  const dwnRequest = {
    messages: [collectionsQueryMessage.toObject()],
  };

  console.log("Sending Request to DWN:");
  console.log(JSON.stringify(dwnRequest));

  let resp;
  try {
    resp = await axios.post("http://localhost:9000", dwnRequest);

    console.log("\nDWN Message Response:");
    console.log(resp.status, JSON.stringify(resp.data, null, 2));
  } catch (e) {
    console.log(e);
  }

  return resp;
};

const submitApplication = async () => {
  console.log("\nStart Submit Application Collections Write\n");

  const { did, privateJWK } = await DIDKey.generate();

  const signatureInput = {
    protectedHeader: { alg: privateJWK.alg, kid: privateJWK.kid },
    jwkPrivate: privateJWK,
  };

  // This is an example of a cred app jwt that is valid for ssi-service
  // const credApp = {
  //   'applicationJwt': 'eyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDprZXk6ejZNa3U4N2NVUlJWUzRkcW44cmV2QjdkTXZGTWRmTGt4enFRMjloZmNRejlkbjhXIiwidHlwIjoiSldUIn0.eyJhbGciOiJFZERTQSIsImNyZWRlbnRpYWxfYXBwbGljYXRpb24iOnsiZm9ybWF0Ijp7Imp3dCI6eyJhbGciOlsiRWREU0EiXX19LCJpZCI6ImlkMTIzIiwibWFuaWZlc3RfaWQiOiJiY2MzNTg5NC0wZDMwLTQxMTgtOWY4Yi1lYzI3NzhmOTg4NjAiLCJwcmVzZW50YXRpb25fc3VibWlzc2lvbiI6eyJkZWZpbml0aW9uX2lkIjoiMzJmNTQxNjMtNzE2Ni00OGYxLTkzZDgtZmYyMTdiZGIwNjUzIiwiZGVzY3JpcHRvcl9tYXAiOlt7ImZvcm1hdCI6Imp3dF92YyIsImlkIjoia3ljMSIsInBhdGgiOiIkLnZlcmlmaWFibGVDcmVkZW50aWFsc1swXSJ9XSwiaWQiOiJwc2lkIn0sInNwZWNfdmVyc2lvbiI6Imh0dHBzOi8vaWRlbnRpdHkuZm91bmRhdGlvbi9jcmVkZW50aWFsLW1hbmlmZXN0L3NwZWMvdjEuMC4wLyJ9LCJpYXQiOjE2NjYzODYyNTEsImlzcyI6ImRpZDprZXk6ejZNa3U4N2NVUlJWUzRkcW44cmV2QjdkTXZGTWRmTGt4enFRMjloZmNRejlkbjhXIiwia2lkIjoiZGlkOmtleTp6Nk1rdTg3Y1VSUlZTNGRxbjhyZXZCN2RNdkZNZGZMa3h6cVEyOWhmY1F6OWRuOFciLCJ2ZXJpZmlhYmxlQ3JlZGVudGlhbHMiOlsiZXlKaGJHY2lPaUpGWkVSVFFTSXNJbXRwWkNJNkltUnBaRHByWlhrNmVqWk5hM2RNVTJsME5IVlRPSFZUUjBSQ09URnRObU5pYjJKalpFeEVOR2x0Ym1VNGJrWnZhVkJwVlRSdWVtdHhJaXdpZEhsd0lqb2lTbGRVSW4wLmV5SmxlSEFpT2pJMU9EQXhNekF3T0RBc0ltbHpjeUk2SW1ScFpEcHJaWGs2ZWpaTmEzZE1VMmwwTkhWVE9IVlRSMFJDT1RGdE5tTmliMkpqWkV4RU5HbHRibVU0YmtadmFWQnBWVFJ1ZW10eElpd2lhblJwSWpvaVptSXhZVEJsWVdJdFkyWmhaaTAwTW1GaUxUa3hZakF0WWpJNVl6Y3lZemc0TW1ReUlpd2libUptSWpveE5qWTJNemcyTWpVd0xDSnpkV0lpT2lKa2FXUTZhMlY1T25vMlRXdDNURk5wZERSMVV6aDFVMGRFUWpreGJUWmpZbTlpWTJSTVJEUnBiVzVsT0c1R2IybFFhVlUwYm5wcmNTSXNJblpqSWpwN0lrQmpiMjUwWlhoMElqcGJJbWgwZEhCek9pOHZkM2QzTG5jekxtOXlaeTh5TURFNEwyTnlaV1JsYm5ScFlXeHpMM1l4SWwwc0ltbGtJam9pWm1JeFlUQmxZV0l0WTJaaFppMDBNbUZpTFRreFlqQXRZakk1WXpjeVl6ZzRNbVF5SWl3aWRIbHdaU0k2V3lKV1pYSnBabWxoWW14bFEzSmxaR1Z1ZEdsaGJDSmRMQ0pwYzNOMVpYSWlPaUprYVdRNmEyVjVPbm8yVFd0M1RGTnBkRFIxVXpoMVUwZEVRamt4YlRaalltOWlZMlJNUkRScGJXNWxPRzVHYjJsUWFWVTBibnByY1NJc0ltbHpjM1ZoYm1ObFJHRjBaU0k2SWpJd01qSXRNVEF0TWpGVU1qRTZNRFE2TVRCYUlpd2laWGh3YVhKaGRHbHZia1JoZEdVaU9pSXlNRFV4TFRFd0xUQTFWREUwT2pRNE9qQXdMakF3TUZvaUxDSmpjbVZrWlc1MGFXRnNVM1ZpYW1WamRDSTZleUpoWkdScGRHbHZibUZzVG1GdFpTSTZJbWhoYm1zZ2FHbHNiQ0lzSW1KcGNuUm9SR0YwWlNJNklqSXdNRGt0TURFdE1ETWlMQ0ptWVcxcGJIbE9ZVzFsSWpvaWMybHRjSE52YmlJc0ltZHBkbVZ1VG1GdFpTSTZJbkpwWTJ0NUlHSnZZbUo1SWl3aWFXUWlPaUprYVdRNmEyVjVPbm8yVFd0M1RGTnBkRFIxVXpoMVUwZEVRamt4YlRaalltOWlZMlJNUkRScGJXNWxPRzVHYjJsUWFWVTBibnByY1NJc0luQnZjM1JoYkVGa1pISmxjM01pT25zaVlXUmtjbVZ6YzBOdmRXNTBjbmtpT2lKVkxsTXVRU0lzSW1Ga1pISmxjM05NYjJOaGJHbDBlU0k2SWtGMWMzUnBiaUlzSW1Ga1pISmxjM05TWldkcGIyNGlPaUpVV0NJc0luQnZjM1JoYkVOdlpHVWlPaUkzT0RjeU5DSXNJbk4wY21WbGRFRmtaSEpsYzNNaU9pSXhNak1nU21GdWEzUnZjR2xoSUVGMlpTNGlmU3dpZEdGNFNVUWlPaUl4TWpNaWZTd2lZM0psWkdWdWRHbGhiRk5qYUdWdFlTSTZleUpwWkNJNklqbGpOekl6TURBd0xUY3dPRGt0TkRoallTMDROR1EwTFRJeVlXWmpaalF3T1dGaU1DSXNJblI1Y0dVaU9pSktjMjl1VTJOb1pXMWhWbUZzYVdSaGRHOXlNakF4T0NKOWZYMC5ScksyQjhEX2hKeF8taEJkYnZNSERFeXlqZ2NOZ2Mtb1kwODFsb21zS0Z6VmFzNm14YVdXMENVWHIzWGdnWEo4SjdQejJFT2plSlVIOUcyT3BFN2RBQSJdfQ.Au7ghMMN8FL2TR3tqoaHhP4pFF8MLS5sgdyG387XNaDWmduqq6xLjE4BJptfnboFAfg_-sb02N2sAmy5P_SeDg'
  // };

  const credAppReq = {
    alg: "EdDSA",
    credential_application: {
      format: {
        jwt: {
          alg: ["EdDSA"],
        },
      },
      id: "id123",
      manifest_id: "0ee5788b-40b8-4f63-a826-4ba07c347e43",
      presentation_submission: {
        definition_id: "32f54163-7166-48f1-93d8-ff217bdb0653",
        descriptor_map: [
          {
            format: "jwt_vc",
            id: "kyc1",
            path: "$.verifiableCredentials[0]",
          },
        ],
        id: "psid",
      },
      spec_version:
        "https://identity.foundation/credential-manifest/spec/v1.0.0/",
    },
    kid: did,
    verifiableCredentials: [
      "eyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDprZXk6ejZNa29IakhaU01ORkFqODFHRjI0OTh3b0s2SEV0RzVteGNIeHdXbkVkNE41Nmh2IiwidHlwIjoiSldUIn0.eyJleHAiOjI1ODAxMzAwODAsImlzcyI6ImRpZDprZXk6ejZNa29IakhaU01ORkFqODFHRjI0OTh3b0s2SEV0RzVteGNIeHdXbkVkNE41Nmh2IiwianRpIjoiODFhYzY1YzMtMmYxNi00NDkxLTgyMjktNDEzMmI0NTdlZGY3IiwibmJmIjoxNjY2NjQ0MjU1LCJzdWIiOiJkaWQ6a2V5Ono2TWtvSGpIWlNNTkZBajgxR0YyNDk4d29LNkhFdEc1bXhjSHh3V25FZDRONTZodiIsInZjIjp7IkBjb250ZXh0IjpbImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL3YxIl0sImlkIjoiODFhYzY1YzMtMmYxNi00NDkxLTgyMjktNDEzMmI0NTdlZGY3IiwidHlwZSI6WyJWZXJpZmlhYmxlQ3JlZGVudGlhbCJdLCJpc3N1ZXIiOiJkaWQ6a2V5Ono2TWtvSGpIWlNNTkZBajgxR0YyNDk4d29LNkhFdEc1bXhjSHh3V25FZDRONTZodiIsImlzc3VhbmNlRGF0ZSI6IjIwMjItMTAtMjRUMjA6NDQ6MTVaIiwiZXhwaXJhdGlvbkRhdGUiOiIyMDUxLTEwLTA1VDE0OjQ4OjAwLjAwMFoiLCJjcmVkZW50aWFsU3ViamVjdCI6eyJhZGRpdGlvbmFsTmFtZSI6ImhhbmsgaGlsbCIsImJpcnRoRGF0ZSI6IjIwMDktMDEtMDMiLCJmYW1pbHlOYW1lIjoic2ltcHNvbiIsImdpdmVuTmFtZSI6InJpY2t5IGJvYmJ5IiwiaWQiOiJkaWQ6a2V5Ono2TWtvSGpIWlNNTkZBajgxR0YyNDk4d29LNkhFdEc1bXhjSHh3V25FZDRONTZodiIsInBvc3RhbEFkZHJlc3MiOnsiYWRkcmVzc0NvdW50cnkiOiJVLlMuQSIsImFkZHJlc3NMb2NhbGl0eSI6IkF1c3RpbiIsImFkZHJlc3NSZWdpb24iOiJUWCIsInBvc3RhbENvZGUiOiI3ODcyNCIsInN0cmVldEFkZHJlc3MiOiIxMjMgSmFua3RvcGlhIEF2ZS4ifSwidGF4SUQiOiIxMjMifSwiY3JlZGVudGlhbFNjaGVtYSI6eyJpZCI6IjEzODhhMjNmLTBmMTUtNDc0YS05ZWFjLTBiZmNmNWNlMzE3ZCIsInR5cGUiOiJKc29uU2NoZW1hVmFsaWRhdG9yMjAxOCJ9fX0.r5tIdj48tKXW60Y0E1YuCJqEC5um7DZUMCOxUblOV-v9GEeCUTRPoGU_6NQSz-mW7jW_ChZp4XM7dy97jXJWAw",
    ],
  };

  const ecPublicKey = await jose.importJWK(privateJWK, "EdDSA");

  const jwt = await new jose.SignJWT(credAppReq)
    .setProtectedHeader({ alg: privateJWK.alg, kid: did, typ: "JWT" })
    .setIssuedAt()
    .setIssuer(did)
    .sign(ecPublicKey);

  let credApp = {
    applicationJwt: jwt,
  };

  const credAppJson = JSON.stringify(credApp);
  const credAppBytes = new TextEncoder().encode(credAppJson);
  const credAppDwnMessage = await CollectionsWrite.create({
    contextId: uuidv4(),
    data: credAppBytes,
    dateCreated: Date.now(),
    dataFormat: "application/json",
    nonce: uuidv4(),
    recipient: didConfig.did,
    recordId: uuidv4(),
    target: didConfig.did,
    protocol:
      "https://identity.foundation/decentralized-web-node/protocols/credential-issuance",
    schema:
      "https://identity.foundation/credential-manifest/schemas/credential-application",
    signatureInput,
  });

  const dwnRequest = {
    messages: [credAppDwnMessage.toObject()],
  };

  console.log("Sending Request to DWN:");
  console.log(JSON.stringify(dwnRequest));

  let resp;
  try {
    resp = await axios.post("http://localhost:9000", dwnRequest);
    console.log("\nDWN Message Response:");
    console.log(resp.status, JSON.stringify(resp.data, null, 2));
  } catch (e) {
    console.log(e);
  }

  return resp;
};

const isValidGetManifestResponse = (getManifestsResp) => {
  if (getManifestsResp.status != 200) {
    return false;
  }

  const decodedData = atob(getManifestsResp.data.replies[0].entries[0].encodedData)
  const decodedDataJson = JSON.parse(decodedData)

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

  const decodedData = atob(submitApplicationResp.data.replies[0].entries[0].encodedData)
  const decodedDataJson = JSON.parse(decodedData)

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
}

const getManifestsResp = await getManifests();
const submitApplicationResp = await submitApplication();


if (!isValidGetManifestResponse(getManifestsResp)) {
  throw new Error("Get Manifest Response is not valid")
}

if(!isValidSubmitApplicationResponse(submitApplicationResp)) {
  throw new Error("Submit Application Response is not valid")
}
