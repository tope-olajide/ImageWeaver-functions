import { app, HttpRequest, HttpResponseInit, InvocationContext, output } from "@azure/functions";

const goingOutToSignalR = output.generic({
    type: 'signalR',
    name: 'signalRMessages',
    hubName: 'tournamenthub',
  connectionStringSetting: 'SIGNALR_CONNECTION_STRING',
  direction: 'out',
    
});
// Function: Broadcast a message to all connected SignalR clients
export async function broadcast(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log(`Processing broadcast request for URL: "${request.url}"`);

  try {
    // Parse request body
    const requestBody = (await request.json()) as { target:string, payload: any };
      const { target, payload  } = requestBody;
     
      console.log("Payload:", payload);   
      console.log("traget:", target);   

    if (!target) {
      return {
        status: 400,
        body: "Invalid request: 'payload' are required",
      };
    }

    if (!payload) {
      return {
        status: 400,
        body: "Invalid request: 'payload' are required",
      };
    }

      // Add message to SignalR output binding
    context.extraOutputs.set(goingOutToSignalR, {
        target,
        'arguments': [payload]
    });

    // Respond with success
    return {
        status: 200,
        body: payload
    };


    // Respond with success
  /*   return {
      status: 200,
      body: payload
    }; */
  } catch (error) {
    context.log("Error broadcasting message:", error);

    // Respond with an error
    return {
      status: 500,
      body: `Error broadcasting message: ${error.message || error}`,
    };
  }
}

// Define the Azure Function with bindings
app.http("broadcast", {
  methods: ["POST"], // Allow POST requests only
  authLevel: "anonymous", // Adjust as needed
  handler: broadcast,
  extraOutputs: [
    {
      type: "signalR",
      name: "signalRMessages",
      hubName: "tournamenthub", // Replace with your SignalR hub name
      connectionStringSetting: "AZURE_SIGNALR_CONNECTION_STRING",
    },
  ],
});
