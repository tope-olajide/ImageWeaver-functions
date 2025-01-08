import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

import { uniqueNamesGenerator, colors, adjectives } from 'unique-names-generator';
import { CosmosClient } from "@azure/cosmos";

import { verifyToken } from "../utils/verifyTokens";

function getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  function generateRandomNumbers(maxNumber: number): number[] {
    const randomNumbers = new Set<number>();
    while (randomNumbers.size < 5) {
      const randomNumber = Math.floor(Math.random() * (maxNumber + 1));
      randomNumbers.add(randomNumber);
    }
    return Array.from(randomNumbers);
}


export async function createTournament(request: HttpRequest, context: InvocationContext ): Promise<HttpResponseInit> {
    return new Promise(async (resolve) => {
    context.log(`Http function processed request for url "${request.url}"`);
const endpoint = process.env.COSMOS_DB_ENDPOINT;
const key = process.env.COSMOS_DB_KEY;
const cosmosClient = new CosmosClient({ endpoint, key });

const database = cosmosClient.database("image-weaver-db");
const tournamentContainer = database.container("tournament");
const tenantId = process.env.TENANT_ID;


    try {
        const token = request.headers.get("authorization")?.split(" ")[1];
        console.log("Token:", token);
        const requestBody: { numberOfPlayers?: number } = await request.json();
        if (!requestBody.numberOfPlayers) {
          resolve({
            status: 400,
            body: "numberOfPlayers is required",
          });
          return;
        }
        const numberOfPlayers: number = requestBody.numberOfPlayers;
        console.log("Number of Players:", numberOfPlayers); 
        if (!token) { 
          resolve({
            status: 401,
            body: "No token provided",
          });
        }
      const decoded = await verifyToken(token);
      const userId = (decoded as { oid: string }).oid;
      const username = (decoded as { preferred_username: string }).preferred_username;
      const name = (decoded as { name: string }).name;

      console.log("Decoded:", decoded);
        const randomName = uniqueNamesGenerator({
            dictionaries: [adjectives, colors],
            separator: "-",
        });
        const randomNum = getRandomNumber(1, 999);
        const tournamentName = randomName + "-" + randomNum;
      const tournamentQuestIndexes = generateRandomNumbers(80);
      console.log("Tournament Quest Indexes:", tournamentQuestIndexes);
        const tournament = {
            name: tournamentName,
            creatorId: userId,
            players: [
                {
                    userId,
                    level: 0,
                    username,
                    coinsPerLevel: [],
                    name
                }
            ],
            numberOfPlayers: Number(numberOfPlayers),
            status: "running",
            startDate: Number(new Date()),
            tournamentQuestIndexes
      };
      
        const { resource: createdTournament } = await tournamentContainer.items.create(tournament);
        resolve({
          status: 200,
        //  body: JSON.stringify({ createdTournament }),
          body: JSON.stringify({ tournament:createdTournament, userId, name }),
        });
    } catch (error) {
        console.log("Error:", error);
          resolve({
            status: 401,
              body: `Error creating tournament: ${error}`
          });
        }
  });
};

app.http('createTournament', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: createTournament
});
