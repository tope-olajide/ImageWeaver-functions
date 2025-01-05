import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

// import { CosmosClient } from "@azure/cosmos";
import { verifyToken } from "../utils/verifyTokens";
import { tournamentContainer } from "../utils/configs";
import { connectToSignalR } from "../utils/services";



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

   // console.log("Tournament [0]:", tournament);
 
/* if (tournament.numberOfPlayers >= tournament.players.length + 1) {
    return {
        status: 400,
        body: "The tournament is full. You can no longer join.",
    };
}

const userAlreadyJoined = tournament.players.some(
    (player: { userId: string }) => player.userId.toString() === userId.toString()
);

if (userAlreadyJoined) {
    const joinedPlayer = tournament.players.find(
        (player) => player.userId.toString() === userId.toString()
    );
    return {
        status: 200,
        body: JSON.stringify({
            message: "Successfully joined the tournament",
            tournament,
            joinedPlayer
        })
    };
} */

tournament.players.push({
    userId,
    level: 0,
    username,
    coinsPerLevel: [],
    name,
});
   //console.log("Tournament-1:", tournament);
    await tournamentContainer.item(tournament.id, tournament.creatorId).replace(tournament);

    console.log("Updated Tournament:");

 /*    const connection = await connectToSignalR(); 
    if (!connection) { 
        return {
            status: 500,
            body: "Error connecting to SignalR"
        };
    } */
/*   console.log("INVOKING:", "PlayerJoined"+"-"+ tournament.name);
    await connection.invoke(
        "PlayerJoined"+"-"+ tournament.name,
        tournament
    ); 
    console.log("Connection:", "PlayerJoined"+"-"+ tournament.name); */
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
