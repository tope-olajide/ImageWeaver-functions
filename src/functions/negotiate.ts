
import {
    app,
    HttpRequest,
    HttpResponseInit,
    InvocationContext,
    input,
  } from "@azure/functions";
  

  const inputSignalR = input.generic({
    type: 'signalRConnectionInfo',
    name: 'connectionInfo',
    hubName: 'tournamenthub',
    connectionStringSetting: "AZURE_SIGNALR_CONNECTION_STRING",
    "direction": "in"
});

  export async function negotiate(
    request: HttpRequest,
      context: InvocationContext,
    
  ): Promise<HttpResponseInit> {
    context.log(`Processing negotiate request for URL: "${request.url}"`);
console.log("context.extraInputs.get(inputSignalR):", context.extraInputs.get(inputSignalR));
      try {
        return { body: JSON.stringify(context.extraInputs.get(inputSignalR)) }
    } catch (error) {
        context.log(error);
        return {
            status: 500,
            jsonBody: error
        }
    }
  }
  
  // Define the Azure Function
  app.http("negotiate", {
    methods: ["GET", "POST"], // Allow GET and POST requests
    authLevel: "anonymous", // Adjust as needed
    handler: negotiate,
    extraInputs: [inputSignalR],
  });
  