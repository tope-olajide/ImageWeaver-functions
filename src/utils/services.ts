import * as signalR from "@microsoft/signalr";

let connection: signalR.HubConnection ;
export const negotiateUrl = "https://image-weaver.azurewebsites.net/api/negotiate"
export const broadcastUrl = "https://image-weaver.azurewebsites.net/api/broadcast"
// Function to create and connect the SignalR connection

export async function connectToSignalR() {
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
        console.log("Already connected to SignalR");
        return connection;
    }

    try {
        const response = await fetch(negotiateUrl);
        const data = await response.json();

        connection = new signalR.HubConnectionBuilder()
            .withUrl(data.url, {
                accessTokenFactory: () => data.accessToken,
            })
            .configureLogging(signalR.LogLevel.Information)
            .withAutomaticReconnect()
            .build();

        await connection.start();
        console.log("SignalR connection established");

        return connection;
    } catch (err) {
        console.error("Error connecting to SignalR:", err);
        throw err;
    }
}

export async function invokeSignalREvent(event, ...args) {
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
        console.error(`Cannot invoke event ${event}: No active SignalR connection`);
        return;
    }

    try {
        console.log(`Invoking SignalR event '${event}' with args:`, args);
        await connection.invoke(event, ...args);
        console.log(`SignalR event '${event}' invoked successfully`, args);
    } catch (err) {
        console.error(`Error invoking SignalR event '${event}':`, err);
    }
}

/* export async function invokeSignalREvent(event, ...args) {
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
        console.error(`Cannot invoke event ${event}: No active SignalR connection`);
        return;
    }

    try {
        console.log(`Invoking SignalR event '${event}' with args:`, args);
        await connection.invoke(event, ...args);
        console.log(`SignalR event '${event}' invoked successfully`, args);
    } catch (err) {
        console.error(`Error invoking SignalR event '${event}':`, err);
    }
}
 */
export async function userJoinedTournament(tournament) {
    if (!connection || connection.state !== signalR.HubConnectionState.Connected) {
        console.error(`Cannot invoke event ${tournament.name}: No active SignalR connection`);
        return;
    }
    fetch(broadcastUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({target:tournament.name, payload:tournament }),
    })
    .then(() => {
        console.log("message sent");
    })
    .catch((error) => {
        console.error("Error sending message:", error);
    });
}

export function onSignalREvent(event, callback) {
    if (!connection) {
        console.error("No active SignalR connection");
        return;
    }

    connection.on(event, callback);
}

// Function to disconnect
export function disconnectSignalR() {
    if (connection) {
        connection.stop().then(() => {
            console.log("SignalR connection disconnected");
        }).catch((err) => {
            console.error("Error disconnecting SignalR:", err);
        });
    }
}