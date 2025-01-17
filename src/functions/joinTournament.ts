import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

import { verifyToken } from "../utils/verifyTokens";
import { connectToSignalR, userJoinedTournament } from "../utils/services";
import { CosmosClient } from "@azure/cosmos";



export async function joinTournament(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const token = request.headers.get("authorization")?.split(" ")[1];

    const requestBody: { tournamentName?: string } = await request.json();
    if (!requestBody.tournamentName) {
        return {
            status: 400,
            body: "tournamentName is required",
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
    


    const tournamentName = requestBody.tournamentName;
    console.log("Tournament Name:", tournamentName);
    const endpoint = process.env.COSMOS_DB_ENDPOINT;
    const key = process.env.COSMOS_DB_KEY;
    const cosmosClient = new CosmosClient({ endpoint, key });
    
    const database = cosmosClient.database("image-weaver-db");
    const tournamentContainer = database.container("tournament");
try{
    const { resources: tournaments } = await tournamentContainer.items
    
    .query({
        query: "SELECT * FROM c WHERE c.name = @tournamentName",
        parameters: [{ name: "@tournamentName", value: tournamentName }]
    })
        .fetchAll();
    

if (tournaments.length === 0) {
    return {
        status: 404,
        body: "Tournament not found",
    };
    }


const tournament = tournaments[0];
    if (tournament.status === "ended") {
        throw new Error("The tournament has ended. You can no longer join.");
    }
    
   // console.log("Tournament [0]:", tournament);
 
    if (tournament.numberOfPlayers >= tournament.players.length + 1) {
    throw new Error("The tournament is full. You can no longer join.");
   
}

const userAlreadyJoined = tournament.players.some(
    (player: { userId: string }) => player.userId.toString() === userId.toString()
);

if (userAlreadyJoined) {
    const joinedPlayer = tournament.players.find(
        (player) => player.userId.toString() === userId.toString()
    );
    await connectToSignalR()
    await userJoinedTournament(tournament)
    return {
        status: 200,
        body: JSON.stringify({
            message: "Successfully joined the tournament",
            tournament,
            joinedPlayer
        })
    };
} 

tournament.players.push({
    userId,
    level: 0,
    username,
    coinsPerLevel: [],
    name,
});

    await tournamentContainer.item(tournament.id, tournament.creatorId).replace(tournament);

    console.log("Updated Tournament:");


    await connectToSignalR()
    await userJoinedTournament(tournament)


return {
    status: 200,
    body: JSON.stringify({
        message: "User successfully added to the tournament.",
        tournament,
        userId,
        name
    })
    };
    }
catch (error) {
    console.log("Error:", error);
        return {
            status: 500,
            body: JSON.stringify({ error: error.message })
        };
    }

};

app.http('joinTournament', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: joinTournament
});
