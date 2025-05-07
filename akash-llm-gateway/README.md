<div align="left">
  
  <a href="https://akash.network/" target="_blank">
    <img src="https://raw.githubusercontent.com/cosmos/chain-registry/master/akash/images/akt.png" alt="Akash logo" title="Akash Network" align="left" height="40" />
  </a>
  
  # Akash LLM Gateway

  **Akash LLM Gateway** is a powerful tool designed to seamlessly integrate with the AkashChat Frontend, enabling you to load balance and manage multiple LLM API endpoints deployed on <a href="https://akash.network" target="_blank">Akash Network</a>. 🚀
  
  This flexible and scalable gateway orchestrates Large Language Model APIs across Akash Network's decentralized cloud ecosystem, providing efficient load balancing and automatic failover for LLM endpoints running on Akash's cost-effective GPU infrastructure.

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![X (formerly Twitter) Follow](https://img.shields.io/twitter/follow/akashnet_)](https://x.com/akashnet_ "Follow Akash Network on X")
[![Discord](https://img.shields.io/badge/discord-join-7289DA.svg?logo=discord&longCache=true&style=flat)](https://discord.gg/akash "Join Akash Discord")
</div>

## About Akash Network Integration

This LLM Gateway is built with Akash Network's decentralized cloud computing platform in mind, allowing users to:

- Leverage Akash's lower-cost GPU resources for running LLM inference services
- Balance loads across multiple LLM endpoints deployed on different Akash providers
- Create redundancy and high availability for AI services in a decentralized environment
- Easily integrate with existing Akash-deployed LLM services
- Connect the AkashChat Frontend to your own LLM deployments running on Akash Network

By using this gateway with Akash Network deployments, you can efficiently distribute workloads and ensure high availability of your LLM services while benefiting from Akash's cost-effective, decentralized GPU resources.

## Features

- 🔄 Load balancing across multiple LLM API endpoints deployed on Akash Network
- 🔒 Built-in authentication middleware
- 🎯 Priority-based routing for Akash providers with different capabilities
- 🔍 Model availability management across the decentralized cloud
- 🔁 Automatic failover between deployments

## Prerequisites

- Node.js
- npm or yarn
- TypeScript
- Access to LLM endpoints (preferably deployed on Akash Network)

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
PORT=3000
API_KEY=your_api_key_here
FILE_LOGGING=true
ENDPOINTS=[{"url":"http://xyz","apiKey":"xyz","priority":1,"weight":1},...] # need to be in one line
```

## Configuration for Akash Deployments

The gateway can be configured with multiple endpoints for different language models running on Akash Network. Configure your endpoints in the environment variables, with each endpoint representing an LLM service deployed on Akash.

Example endpoint configuration for Akash-deployed LLMs:
```json
{
  "url": "https://your-akash-deployment-url.com",
  "apiKey": "your_api_key",
  "priority": 1,
  "weight": 1
}
```

### Configuration Parameters

- `url`: The URL of your LLM API endpoint deployed on Akash
- `apiKey`: API key for authentication with that endpoint
- `priority`: Lower values indicate higher priority (used for failover)
- `weight`: Relative weight for load balancing (higher values receive more traffic)

## API Endpoints

### GET /v1/models
Returns a list of available models across all configured Akash-deployed endpoints.

### POST /v1/chat/completions
Proxies chat completion requests to the appropriate LLM endpoint based on load balancing and availability across your Akash deployments.

## Project Structure

```
src/
├── controllers/     # Request handlers
├── middleware/      # Authentication and other middleware
├── services/        # Core logic
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── routes.ts       # API route definitions
└── index.ts        # Application entry point
```

## Development

To start the development server:

```bash
npm run dev
```

For production:

```bash
npm run build
npm start
```

## Authentication

The gateway includes built-in authentication middleware. Requests to the API endpoints must include a valid API key in the `Authorization` header:

```
Authorization: Bearer your_api_key_here
```

## Error Handling

The gateway implements robust error handling with automatic retries and failover to alternative Akash-deployed endpoints when primary endpoints fail, ensuring resilience in a decentralized cloud environment.

## Deploying on Akash Network

The Akash LLM Gateway itself can be deployed on Akash Network for a fully decentralized setup. Check out the [Akash Network documentation](https://docs.akash.network/) for details on deploying applications.

## Benefits of Running on Akash

- **Cost Efficiency**: Access to GPUs at up to 85% lower cost than traditional cloud providers
- **Decentralization**: No single point of failure across your LLM infrastructure
- **Scalability**: Easily scale across multiple providers in the Akash ecosystem
- **Sovereignty**: Maintain control over your AI infrastructure without relying on centralized providers

## AkashChat Frontend Integration

The Akash LLM Gateway was specifically developed to allow users to connect the AkashChat Frontend with their own LLM deployments running on the Akash Network. By setting up this gateway, you can:

- Use the user-friendly AkashChat interface while running your own language models
- Maintain full control over which LLM endpoints are used by the chat interface
- Distribute loads across multiple instances of your models for improved performance
- Ensure privacy and data sovereignty by using your own infrastructure
- Seamlessly integrate with the existing AkashChat ecosystem

To connect this gateway to AkashChat Frontend, configure the AkashChat application to use your gateway's URL as its API endpoint. This allows you to leverage the AkashChat interface while directing all AI requests to your own Akash-deployed LLM services.

## License

See [LICENSE](/akash-llm-gateway/LICENSE)