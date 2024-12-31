import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import jwksClient = require("jwks-rsa");
import jwt = require("jsonwebtoken");

import { uniqueNamesGenerator, colors, adjectives } from 'unique-names-generator';
import { CosmosClient } from "@azure/cosmos";

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
const tenantId = process.env.TENANT_ID;
const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/keys` 
});

const endpoint = process.env.COSMOS_DB_ENDPOINT;
const key = process.env.COSMOS_DB_KEY;
const cosmosClent = new CosmosClient({ endpoint, key });

const database = cosmosClent.database("image-weaver-db");
const tournamentCointainer = database.container("tournament");

function getKey(header, callback) {
  console.log("Header:", header);

  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      console.log("Error getting signing key:", err); 
      return callback(err);
    }
    const signingKey = key.getPublicKey();
    console.log("Signing key:", signingKey);
    callback(null, signingKey);
  });
}

// Function to verify token
function verifyToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
      if (err) {
        reject(`Token verification failed: ${err.message}`);
      } else {
        resolve(decoded); // token is valid
      }
    });
  });
}
export async function createTournament(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    return new Promise(async (resolve) => {
    context.log(`Http function processed request for url "${request.url}"`);


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
        const username = (decoded as { username: string }).username;

        const randomName = uniqueNamesGenerator({
            dictionaries: [adjectives, colors],
            separator: "-",
        });
        const randomNum = getRandomNumber(1, 9999);
        const tournamentName = randomName + "-" + randomNum;
  
        const tournament = {
            name: tournamentName,
            creatorId: userId,
            players: [
                {
                    userId,
                    level: 0,
                    username,
                    coinsPerLevel: []
                }
            ],
            numberOfPlayers: Number(numberOfPlayers),
            status: "running",
            startDate: Number(new Date()),
            tournamentQuestIndexes: [1, 2, 3]
        };
    const { resource: createdTournament } = await tournamentCointainer.items.create(tournament);
          resolve({
            status: 200,
            body: JSON.stringify({ createdTournament }),
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
