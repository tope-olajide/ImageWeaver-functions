
import jwksClient = require("jwks-rsa");

import { CosmosClient } from "@azure/cosmos";
const endpoint = process.env.COSMOS_DB_ENDPOINT;
const key = process.env.COSMOS_DB_KEY;
const cosmosClient = new CosmosClient({ endpoint, key });

const database = cosmosClient.database("image-weaver-db");
const tournamentContainer = database.container("tournament");
const tenantId = process.env.TENANT_ID;
const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/keys` 
});



export { endpoint, key, cosmosClient, database, tournamentContainer, client, tenantId };