export default {
  relay: {
    numProcesses : 1,
    handlers     : [
      {
        filter: {
          method : 'CollectionsQuery',
          schema : 'https://somehost.com/CredentialManifest',
        },
        endpoint: {
          method : 'GET',
          url    : (process.env.API_URL == undefined ? 'http://localhost:8080' : process.env.API_URL) + '/v1/manifests',
        },
        responseMapping: {
          200: {
            schema: 'https://identity.foundation/credential-manifest/schemas/credential-manifest',
          },
        },
      },
      {
        filter: {
          method   : 'CollectionsWrite',
          protocol : 'https://identity.foundation/decentralized-web-node/protocols/credential-issuance',
          schema   : 'https://identity.foundation/credential-manifest/schemas/credential-application',
        },
        endpoint: {
          method : 'PUT',
          url    : (process.env.API_URL == undefined ? 'http://localhost:8080' : process.env.API_URL) + '/v1/manifests/applications',
        },
        responseMapping: {
          201: {
            schema: 'https://identity.foundation/credential-manifest/schemas/credential-response',
          },
        },
      },
    ],
  },
};
