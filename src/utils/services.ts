import * as signalR from "@microsoft/signalr";

let connection = null; // Store the SignalR connection instance
const negotiateUrl = 'http://localhost:7071/api/negotiate';
const broadcastUrl = 'http://localhost:7071/api/broadcast';
export async function connectToSignalR() {
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
        console.log("Already connected to SignalR");
        return connection;
    }

    try {
        // Fetch negotiation details
        const response = await fetch(negotiateUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.statusText}`);
        }

        const data = await response.json();
        console.log({ url: data });

        // Set up SignalR connection options
        const options = {
            accessTokenFactory: () => data.accessToken,
        };

        // Create and configure SignalR connection
        connection = new signalR.HubConnectionBuilder()
            .withUrl(data.url, options)
            .configureLogging(signalR.LogLevel.Information)
            .withAutomaticReconnect()
            .build();

        // Handle disconnection
        connection.onclose(() => console.log("Disconnected from SignalR"));

        console.log("Connecting to SignalR...");
        await connection.start();
        console.log("Connected to SignalR");

        return connection;
    } catch (error) {
        console.error("Error connecting to SignalR:", error);
        throw error;
    }
}

async function invokePlayerJoined(tournamentName, user, tournament, joinedPlayer) {
    try {
        const connection = await connectToSignalR(); // Ensure connection is established

        await connection.invoke(
            "PlayerJoined",
            tournamentName,
            user._id,
            user.username,
            tournament.numberOfPlayers,
            joinedPlayer?.score,
            tournament.players
        );

        console.log("PlayerJoined event sent successfully");
    } catch (err) {
        console.error("Error sending PlayerJoined event:", err);
    }
}
