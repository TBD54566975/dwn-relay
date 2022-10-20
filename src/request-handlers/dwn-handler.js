import axios from 'axios';

import { base64url } from 'multiformats/bases/base64';
import { v4 as uuidv4 } from 'uuid';

import { CollectionsWrite } from '@tbd54566975/dwn-sdk-js';
import dwn from '../dwn';
import didConfig from '../did/did-loader';
import handlerIndex from '../handler-index';

const { did, privateJWK } = didConfig;
const http = axios.create({
  // always resolve promise if a response was returned regardless of status
  validateStatus: null
});

export default async function dwnHandler(req, res) {
  const resp = await dwn.processRequest(req.body);
  const status = resp.status?.code || 200;

  if (status >= 400) {
    return res.status(status).json(resp);
  }

  // check to see if any handlers match the processed message.
  //! NOTE: Naively assuming request only contains a single message
  
  const { replies } = resp;
  const [ reply ] = replies;

  const messageReplyStatus = reply.status?.code || 200;

  if (messageReplyStatus >= 400) {
    return res.status(status).json(resp);
  }
  
  let dwnRequest = new TextDecoder().decode(req.body);
  dwnRequest = JSON.parse(dwnRequest);

  const { messages } = dwnRequest;
  const [ dwnMessage ] = messages;
  const { descriptor } = dwnMessage;
  
  const handlerFilter = {};
  for (let field of ['method', 'protocol', 'schema']) {
    if (field in descriptor) {
      handlerFilter[field] = descriptor[field];
    }
  }

  const matchedHandlers = handlerIndex.query(handlerFilter);

  if (matchedHandlers.length === 0) {
    return res.status(status).json(resp);
  }

  // send request to matched handler
  //! NOTE: Naively assuming 1 matched handler for now

  const [ matchedHandler ] = matchedHandlers;
  const { endpoint } = matchedHandler.document;

  // TODO: add support for custom request builder

  let requestOpts = { url: endpoint.url, method: endpoint.method };

  if (dwnMessage.encodedData) {
    const messageDataBytes = base64url.baseDecode(dwnMessage.encodedData);
    const messageDataStr = new TextDecoder().decode(messageDataBytes);

    requestOpts.data = messageDataStr;
  }

  try {
    const downstreamResp = await http(requestOpts);

    if (downstreamResp.status >= 400) {
      // TODO: delete dwn message using `CollectionsDelete`
      
      let responseData;

      // TODO: Yikes. Revisit. `detail` is too loosey goosey rn
      if (downstreamResp.data) {
        responseData = JSON.stringify(downstreamResp.data);
      } else {
        responseData = 'Internal server error';
      }

      
      resp.replies[0] = {
        status: { code: downstreamResp.status, detail: responseData }
      };

      return res.status(status).json(resp);
    }

    const { responseMapping = {}} = endpoint;
    const statusMapping = responseMapping[downstreamResp.status];

    console.log(JSON.stringify(downstreamResp.data, null, 2));

    resp.replies[0] = {
      status: { code: downstreamResp.status }
    };

    if (!statusMapping) {
      return res.status(status).json(resp);
    }

    const collectionsWriteInput = { ...statusMapping, target: didConfig.did, recordId: uuidv4() };


    if ('content-type' in downstreamResp.headers) {
      collectionsWriteInput.dataFormat = downstreamResp.headers['content-type'];
    }
    
    const { 
      descriptor: originatingMessageDescriptor, 
      authorization: originatingMessageAuthorization 
    } = dwnMessage;

    const [ signature ] = originatingMessageAuthorization.signatures;
    const decodedJwsHeader = base64url.baseDecode(signature.protected);
    
    collectionsWriteInput.recipient = decodedJwsHeader.kid.split('#');

    const { privateJWK } = didConfig;
    collectionsWriteInput.signatureInput = {
      protectedHeader : { alg: privateJWK.alg, kid: privateJWK.kid },
      jwkPrivate      : privateJWK
    };

    if (originatingMessageDescriptor.protocol) {
      collectionsWriteInput.protocl = originatingMessageDescriptor.protocol;
      collectionsWriteInput.contextId = originatingMessageDescriptor.contextId;
      collectionsWriteInput.parentId = originatingMessageDescriptor.recordId;
    }

    if (resp.data) {
      const dataStr = JSON.stringify(resp.data);
      collectionsWriteInput.data = new TextEncoder().encode(dataStr);
    }
    
    const dwmifiedResponse = await CollectionsWrite.create(collectionsWriteInput);
    
    // TODO: handle errors
    await dwn.processMessage(dwmifiedResponse);

    const theOtherThang = { ...collectionsWriteInput };
    theOtherThang.target = collectionsWriteInput.recipient;

    resp.replies[0] = {
      status  : { code: downstreamResp.status },
      entries : [theOtherThang]
    };

    return res.status(200).json(resp);

  } catch(error) {
    console.error(error);
    if (error.request) {
      // The request was made but no response was received. `error.request` is an instance of http.ClientRequest
    } else {
      // Something happened in setting up the request that triggered an Error
    }
    // TODO: handle error
  }

  return res.sendStatus(501);
}