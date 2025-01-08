import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

import { verifyToken } from "../utils/verifyTokens";
import { Tournament } from "../utils/type";
import { connectToSignalR, userJoinedTournament } from "../utils/services";

export async function updateLevel(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    try {
        context.log(`Http function processed request for url "${request.url}"`);

        const requestBody = await request.json() as { tournamentName: string, level: number, coins: number };

        if (!requestBody.tournamentName) {
            return {
                status: 400,
                body: "tournamentName is required",
            };
        }
        const token = request.headers.get("authorization")?.split(" ")[1];
        if (!token) {
            return {
                status: 401,
                body: "No token provided",
            };
        }

        const decoded = await verifyToken(token);
        const userId = (decoded as { oid: string }).oid;

        const endpoint = process.env.COSMOS_DB_ENDPOINT;
        const key = process.env.COSMOS_DB_KEY;
        const cosmosClient = new CosmosClient({ endpoint, key });

        const database = cosmosClient.database("image-weaver-db");
        const tournamentContainer = database.container("tournament");
        const tournamentName = requestBody.tournamentName;
        const level = requestBody.level;
        const coins = requestBody.coins;

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

        const tournament: Tournament = tournaments[0];
        console.log("Tournament:", tournament);

        // Find the player in the tournament
        const playerIndex = tournament.players.findIndex(
            (player) => player.userId === userId
        );

        if (playerIndex === -1) {
            throw new Error("Player not found in the tournament");
        }
        const newLevel = level + 1;
        const coinsPerLevel = { level: newLevel, coins };
        tournament.players[playerIndex].level = newLevel;
        tournament.players[playerIndex].coinsPerLevel.push(coinsPerLevel);

        // Check if the tournament should end
        if (newLevel >= 5) {
            tournament.status = "ended";
            tournament.winnerId = userId;

            await connectToSignalR();
            await userJoinedTournament(tournament);

            // Update the tournament status and winner
            await tournamentContainer.item(tournament.id, tournament.creatorId).replace(tournament);

            return {
                status: 200,
                body: "Tournament has ended",
            };
        }

        // Update the tournament with the new player level and coins
        await tournamentContainer.item(tournament.id, tournament.creatorId).replace(tournament);
        console.log("New Tournament:", tournament);
        await connectToSignalR();
        await userJoinedTournament(tournament);

        return {
            status: 200,
            body: "Player level updated successfully",
        };
    } catch (error) {
        context.log(`Error: ${error.message}`);
        return {
            status: 500,
            body: "An error occurred while updating the player level",
        };
    }
}

app.http('updateLevel', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: updateLevel
});
