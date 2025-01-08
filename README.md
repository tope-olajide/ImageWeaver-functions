# Image Weaver Serverless Node.js Function

## Prerequisites

Before you begin, ensure you have the following:

- [Azure Account](https://azure.microsoft.com/en-us/free/)
- [Node.js](https://nodejs.org/) installed (LTS recommended)
- [Azure Functions Core Tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local) installed

## Setup Instructions

### Step 1: Sign Up & Retrieve Tokens

You need to sign up for the required Azure services and obtain the following tokens:

- `TENANT_ID`
- `COSMOS_DB_ENDPOINT`
- `COSMOS_DB_KEY`
- `AZURE_SIGNALR_CONNECTION_STRING`
- `SIGNALR_ENDPOINT`
- `SIGNALR_ACCESS_TOKEN`

### Step 2: Configure Local Settings

Create a `local.settings.json` file in the root of your project if it does not already exist. Then, add the following configuration:

```json
{
    "IsEncrypted": false,
    "Values": {
        "AzureWebJobsStorage": "UseDevelopmentStorage=true",
        "TENANT_ID": "",
        "COSMOS_DB_ENDPOINT": "",
        "COSMOS_DB_KEY": "",
        "AZURE_SIGNALR_CONNECTION_STRING": "",
        "SIGNALR_ENDPOINT": "",
        "SIGNALR_ACCESS_TOKEN": ""
    }
}
```

Replace the empty values with your actual Azure credentials.

### Step 3: Install Dependencies

Run the following command to install required dependencies:

```sh
npm install
```

### Step 4: Build & Start the Application

To build and start the application, run:

```sh
npm run build
npm start
```

Alternatively, you can use Azure Functions Core Tools to start the function locally:

```sh
func start
```

## License

This project is licensed under the terms defined in the `LICENSE.md` file.

