import axios from 'axios';

import { base64url } from 'multiformats/bases/base64';

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
    
    // TODO: implement support for when a `responseMapping` is present
    // - build DWebMessage using `downstreamResp.data` + `responseMapping`
    // - store DWebMessage 
    // - add DWebMessage to `reply.entries`
    // - return response

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