import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { verifyToken } from "../utils/verifyTokens";
import { connectToSignalR, userJoinedTournament } from "../utils/services";
import { CosmosClient } from "@azure/cosmos";
import { GameData } from "../utils/type";


export async function saveGameData(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);
    const endpoint = process.env.COSMOS_DB_ENDPOINT;
    const key = process.env.COSMOS_DB_KEY;
    const cosmosClient = new CosmosClient({ endpoint, key });

const database = cosmosClient.database("image-weaver-db");
    const  gameDataContainer = database.container("gameData");
    const token = request.headers.get("authorization")?.split(" ")[1];

    const requestBody: { gameData?:GameData } = await request.json();
    if (!requestBody.gameData) {
        return {
            status: 400,
            body: "parsedGameData is required",
        };
    }
    if (!token) { 
        return({
          status: 401,
          body: "No token provided",
        });
      }

      const decoded = await verifyToken(token);
      const userId = (decoded as { oid: string }).oid;
      const username = (decoded as { preferred_username: string }).preferred_username;
    const name = (decoded as { name: string }).name;
    const gameData = requestBody.gameData;

    try {
    const querySpec = {
        query: "SELECT * FROM c WHERE c.userId = @userId",
        parameters: [
        {
            name: "@userId",
            value: userId
        }
        ]
    };

    const { resources: existingGameData } = await gameDataContainer.items.query(querySpec).fetchAll();

    if (existingGameData.length > 0) {
        const existingItem = existingGameData[0];
        const updatedGameData = {
        ...existingItem,
        ...gameData,
        timestamp: new Date().toISOString()
        };
        const { resource: updatedItem } = await gameDataContainer.item(existingItem.id, existingItem.userId).replace(updatedGameData);
        console.log("Updated GameData:", updatedItem);
    } else {
        const newGameData = {
        userId,
        username,
        name,
        ...gameData,
        timestamp: new Date().toISOString()
        };
        const { resource: createdGameData } = await gameDataContainer.items.create(newGameData);
        console.log("Created GameData:", createdGameData);
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

app.http('saveGameData', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: saveGameData
});
