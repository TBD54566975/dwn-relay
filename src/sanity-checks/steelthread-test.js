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

    console.log("\nCollections Query DWN Message Response:\n");
    console.log(resp.status, JSON.stringify(resp.data, null, 2));


    console.log("\nCollections Query Decoded Data:\n");
    console.log(atob(resp.data.replies[0].entries[0].encodedData))

  } catch (e) {
    console.log(e);
  }

  return resp;
};

const submitApplication = async (getManifestsResp) => {
  console.log("\nStart Submit Application Collections Write\n");

  const getManifestsDecodedData = atob(getManifestsResp.data.replies[0].entries[0].encodedData)
  const getManifestsDecodedDataJson = JSON.parse(getManifestsDecodedData)


  console.log("\n HERE \n")
  console.log(getManifestsDecodedDataJson.manifests[0].credential_manifest)

  const { did, privateJWK } = await DIDKey.generate();

  const signatureInput = {
    protectedHeader: { alg: privateJWK.alg, kid: privateJWK.kid },
    jwkPrivate: privateJWK,
  };

  // TODO: Dynamically Create VC
  const credAppReq = {
    alg: "EdDSA",
    credential_application: {
      format: {
        jwt: {
          alg: ["EdDSA"],
        },
      },
      id: "id123",
      manifest_id: getManifestsDecodedDataJson.manifests[0].credential_manifest.id,
      presentation_submission: {
        definition_id: getManifestsDecodedDataJson.manifests[0].credential_manifest.presentation_definition.id,
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
      "eyJhbGciOiJFZERTQSIsImtpZCI6ImRpZDprZXk6ejZNa3Z4UHh1eXFUVnI0YVZLck00cTY1ekJZYUFrNHJ3SzZrd1JUUDRLbVptVEVtIiwidHlwIjoiSldUIn0.eyJleHAiOjI1ODAxMzAwODAsImlzcyI6ImRpZDprZXk6ejZNa3Z4UHh1eXFUVnI0YVZLck00cTY1ekJZYUFrNHJ3SzZrd1JUUDRLbVptVEVtIiwianRpIjoiNTIyYTY3NzQtNWZmNi00MDcyLTk3NjItMmIzOGM0NDE2Y2U0IiwibmJmIjoxNjY2NzIwNzUyLCJzdWIiOiJkaWQ6a2V5Ono2TWt2eFB4dXlxVFZyNGFWS3JNNHE2NXpCWWFBazRyd0s2a3dSVFA0S21abVRFbSIsInZjIjp7IkBjb250ZXh0IjpbImh0dHBzOi8vd3d3LnczLm9yZy8yMDE4L2NyZWRlbnRpYWxzL3YxIl0sImlkIjoiNTIyYTY3NzQtNWZmNi00MDcyLTk3NjItMmIzOGM0NDE2Y2U0IiwidHlwZSI6WyJWZXJpZmlhYmxlQ3JlZGVudGlhbCJdLCJpc3N1ZXIiOiJkaWQ6a2V5Ono2TWt2eFB4dXlxVFZyNGFWS3JNNHE2NXpCWWFBazRyd0s2a3dSVFA0S21abVRFbSIsImlzc3VhbmNlRGF0ZSI6IjIwMjItMTAtMjVUMTc6NTk6MTJaIiwiZXhwaXJhdGlvbkRhdGUiOiIyMDUxLTEwLTA1VDE0OjQ4OjAwLjAwMFoiLCJjcmVkZW50aWFsU3ViamVjdCI6eyJhZGRpdGlvbmFsTmFtZSI6ImhhbmsgaGlsbCIsImJpcnRoRGF0ZSI6IjIwMDktMDEtMDMiLCJmYW1pbHlOYW1lIjoic2ltcHNvbiIsImdpdmVuTmFtZSI6InJpY2t5IGJvYmJ5IiwiaWQiOiJkaWQ6a2V5Ono2TWt2eFB4dXlxVFZyNGFWS3JNNHE2NXpCWWFBazRyd0s2a3dSVFA0S21abVRFbSIsInBvc3RhbEFkZHJlc3MiOnsiYWRkcmVzc0NvdW50cnkiOiJVLlMuQSIsImFkZHJlc3NMb2NhbGl0eSI6IkF1c3RpbiIsImFkZHJlc3NSZWdpb24iOiJUWCIsInBvc3RhbENvZGUiOiI3ODcyNCIsInN0cmVldEFkZHJlc3MiOiIxMjMgSmFua3RvcGlhIEF2ZS4ifSwidGF4SUQiOiIxMjMifSwiY3JlZGVudGlhbFNjaGVtYSI6eyJpZCI6Ijg3MzZkMTBjLTg5Y2MtNDg5ZS1iYzJjLTQzZDBmZmY1YjYzMCIsInR5cGUiOiJKc29uU2NoZW1hVmFsaWRhdG9yMjAxOCJ9fX0.pnDBPMtg05AjugX7QagvGBZepkaIseDSiOLKrHmOe6B7IhRpZ_RQxjRwLlHmqBd1dsmRJkGq6gYtSr12W8woBQ",
    ],
  };

  console.log("\n HERE 2\n")
  console.log(credAppReq)
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
    console.log("\nCollections Write DWN Message Response:\n");
    console.log(resp.status, JSON.stringify(resp.data, null, 2));

    console.log("\nCollections Write Decoded Data:\n");
    console.log(atob(resp.data.replies[0].entries[0].encodedData))

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
const submitApplicationResp = await submitApplication(getManifestsResp);


if (!isValidGetManifestResponse(getManifestsResp)) {
  throw new Error("Get Manifest Response is not valid")
}

if(!isValidSubmitApplicationResponse(submitApplicationResp)) {
  throw new Error("Submit Application Response is not valid")
}
