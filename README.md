<div align="left">
  
  <a href="https://akash.network/" target="_blank">
    <img src="https://raw.githubusercontent.com/cosmos/chain-registry/master/akash/images/akt.png" alt="Akash logo" title="Akash Network" align="left" height="40" />
  </a>
  
  # AkashChat

  **AkashChat** is a modern, feature-rich chat application developed for Akash Network, providing a clean interface for conversing with AI models, managing chat history, configuring model parameters, and generating images. 🚀
  
  Built with performance and usability in mind, this application serves as both a showcase of Akash Network's decentralized cloud infrastructure capabilities and a practical tool for AI-assisted communication.

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![X (formerly Twitter) Follow](https://img.shields.io/twitter/follow/akashnet_)](https://x.com/akashnet_ "Follow Akash Network on X")
[![Discord](https://img.shields.io/badge/discord-join-7289DA.svg?logo=discord&longCache=true&style=flat)](https://discord.gg/akash "Join Akash Discord")
</div>

## Features

- **Multiple AI Model Support**: 
  - Supports various models including Llama 3 variants (70B, 405B, 8B), Qwen, DeepSeek, Mistral, and more
  - Each model configurable with temperature and top_p parameters
  
- **Vision & Image Features**:
  - Image generation capabilities using AkashGen
  - Image status tracking for generation processes
  
- **Voice Capabilities**:
  - Real-time voice transcription for hands-free interaction with extra backend
  - Configurable recording time limits (up to 3 minutes)
  
- **Advanced Chat Functions**:
  - LaTeX support for mathematical content
  
- **User Experience**:
  - Chat organization with folders
  - Customizable system prompts
  - Responsive design for desktop and mobile
  - Dark/Light mode theme options
  - Markdown support with code highlighting

## About Akash Network Integration

AkashChat leverages the decentralized cloud infrastructure of Akash Network, offering a powerful AI chat experience with access to a variety of AI models. By using AkashChat with Akash Network deployments, you can:

- **Cost Efficiency**: Access to GPUs at up to 85% lower cost than traditional cloud providers
- **Decentralization**: No single point of failure across your AI infrastructure
- **Scalability**: Easily scale across multiple providers in the Akash ecosystem
- **Sovereignty**: Maintain control over your AI infrastructure without relying on centralized providers

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Redis server (for caching and session management)
- API keys/endpoints for the AI models you want to use

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/akash-network/akash-chat.git
   cd chat
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```env
   # API Configuration
   API_KEY=your_api_key_here
   API_ENDPOINT=your_api_endpoint_here
   DEFAULT_MODEL=your_default_model_here
   
   # Image Generation Configuration (Optional)
   IMG_API_KEY=your_image_api_key_here
   IMG_ENDPOINT=your_image_endpoint_here
   IMG_GEN_FN_MODEL=your_image_generation_model_here
   
   # Redis Configuration
   REDIS_URL=redis://localhost:6379
   
   # Session Configuration
   CACHE_TTL=3600 # Session time-to-live in seconds
   
   # Optional - Access Token for API and Frontend protection
   ACCESS_TOKEN=your_secret_access_token # Will be hashed automatically
   
   # Voice Transcription Configuration
   WS_TRANSCRIPTION_URLS=your_websocket_urls_here
   WS_TRANSCRIPTION_MODEL=your_transcription_model_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| API_KEY | Authentication key for Akash AI API access | Yes | - |
| API_ENDPOINT | Base URL for Akash AI API | Yes | https://chatapi.akash.network/api/v1 |
| DEFAULT_MODEL | Default AI model to use | No | Qwen-QwQ-32B |
| REDIS_URL | Connection URL for Redis | Yes | redis://localhost:6379 |
| CACHE_TTL | Cache time-to-live in seconds | No | 600 (10 minutes) |
| ACCESS_TOKEN | Token for API and frontend protection | No | - |
| WS_TRANSCRIPTION_URLS | Comma-separated WebSocket URLs for voice transcription | No | - |
| WS_TRANSCRIPTION_MODEL | Model for voice transcription | No | mobiuslabsgmbh/faster-whisper-large-v3-turbo |
| IMG_API_KEY | Authentication key for AkashGen image generation | No | - |
| IMG_ENDPOINT | Endpoint for AkashGen image generation | No | - |
| IMG_GEN_FN_MODEL | Model for AkashGen image generation | No | - |

## Deployment on Akash Network

AkashChat can be deployed on Akash Network for a fully decentralized setup. Check out the [Akash Network documentation](https://docs.akash.network/) for details on deploying applications.

## About Akash Network

[Akash Network](https://akash.network) is the world's first decentralized and open-source cloud, providing a faster, more efficient, and lower cost computing platform for Web3. 

Akash Network's marketplace for cloud compute enables anyone to buy and sell cloud computing using its native token, AKT. The platform gives developers access to a vast network of cloud resources at competitive prices, while allowing data center owners to monetize their unused capacity.

For more information, visit [akash.network](https://akash.network) or join the [Akash Community](https://discord.com/invite/akash).

## License

See [LICENSE](LICENSE)