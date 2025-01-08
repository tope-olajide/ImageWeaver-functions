
import jwksClient = require("jwks-rsa");

import { CosmosClient } from "@azure/cosmos";

const tenantId = process.env.TENANT_ID;
const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/keys` 
});



export {  client, tenantId };