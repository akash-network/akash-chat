# AkashChat V2 - Advanced Chatbot UI

AkashChat V2 is an enhanced chatbot interface based on [Chatbot UI Lite](https://github.com/mckaywrigley/chatbot-ui-lite) a next-generation chatbot interface utilizing Next.js, TypeScript, and Tailwind CSS.

## Updates & Modifications

AkashChat is under active development and will be updated regularly to introduce new features and enhancements. We value your feedback and suggestions to improve the user experience.

**Recent updates:**

- Initial release of Version 2 of AkashChat (04/04/2024)

## Running Locally

**1. Clone Repo**

```bash
git clone https://github.com/akash-network/akash-chat.git
```

**2. Install Dependencies**

```bash
npm i
```

**3. Provide API Endpoint**

Create a .env.local file in the root of the repo.

```bash
DEFAULT_MODEL=mistral
DEFAULT_SYSTEM_PROMPT=You are a helpful and friendly assistant. Follow the user's instructions carefully. Don't use emojis or slang. Provide accurate and helpful information.
API_KEY=yourkey
API_HOST=yourollamaendpoint
```

> API_HOST is the endpoint of your compatible endpoint like a Ollama deployment
> See `/types/llms.ts` how to add additional models.

**4. Run App**

```bash
npm run dev
```
