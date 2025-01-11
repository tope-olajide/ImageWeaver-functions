import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { verifyToken } from "../utils/verifyTokens";

import { CosmosClient } from "@azure/cosmos";


export async function fetchHighScores(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const token = request.headers.get("authorization")?.split(" ")[1];
    const endpoint = process.env.COSMOS_DB_ENDPOINT;
    const key = process.env.COSMOS_DB_KEY;
    const cosmosClient = new CosmosClient({ endpoint, key });
    
    const database = cosmosClient.database("image-weaver-db");
    const  gameDataContainer = database.container("gameData");
    
    if (!token) { 
        return({
          status: 401,
          body: "No token provided",
        });
      }

      const decoded = await verifyToken(token);
      const userId = (decoded as { oid: string }).oid;
    const username = (decoded as { preferred_username: string }).preferred_username;
    
 try {
    const querySpec = {
        query: "SELECT TOP 10 * FROM gameData g ORDER BY g.level DESC"
    };

     const { resources: gameData } = await gameDataContainer.items.query(querySpec).fetchAll();
     
        console.log("Game Data:", gameData);    
        if (gameData.length === 0) {
            return {
            status: 404,
            body: "Game data not found"
            };
    }
        return {
            status: 200,
            body: JSON.stringify(gameData)
        };
    }

    catch (error) {
        console.log("Error:", error);
        return {
            status: 500,
            body: "Internal Server Error"
        };
    }

};

app.http('fetchHighScores', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: fetchHighScores
});
