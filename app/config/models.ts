export interface Model {
  id: string;
  name: string;
  description?: string;
  available: boolean;
  temperature?: number;
  top_p?: number;
  tokenLimit?: number;
  owned_by?: string;
  parameters?: string;
  architecture?: string;
  hf_repo?: string;
  aboutContent?: string;
  infoContent?: string;
  thumbnailId?: string;
  deployUrl?: string;
}

export const models: Model[] = [
  {
    id: 'Kimi-K2-Instruct',
    name: 'Kimi K2 Instruct',
    description: 'Advanced 1T Mixture-of-Experts model (32B active)',
    available: true,
    temperature: 0.6,
    top_p: 0.95,
    tokenLimit: 128000,
    parameters: '1T (32B active)',
    architecture: 'Mixture-of-Experts (384 experts, 8 activated)',
    hf_repo: 'moonshotai/Kimi-K2-Instruct',
    aboutContent: `Discover **Kimi K2 Instruct**, a next-generation Mixture-of-Experts (MoE) language model with 1 trillion total parameters and 32 billion activated per token. Trained on 15.5T tokens with the Muon optimizer, Kimi K2 achieves exceptional performance in knowledge, reasoning, coding, and agentic tasks. Specifically designed for tool use and autonomous problem-solving, it excels in both chat and agentic experiences.\n\nKimi K2 Instruct features a 128K context window, advanced MLA attention, and robust instruction-following capabilities. It is a top performer on coding, reasoning, and tool-use benchmarks, making it ideal for demanding AI applications.`,
    infoContent: `\n* ⚡ 1T parameter Mixture-of-Experts model (32B active)\n* 🧠 128K context window for extended conversations\n* 🛠️ Optimized for tool use, reasoning, and agentic intelligence\n* 🌐 Open-source, deployable on vLLM, SGLang, KTransformers, TensorRT-LLM\n* 🔍 Top-tier performance in coding, reasoning, and tool-use tasks`,
    thumbnailId: 'llama-3',
  },
  {
    id: 'Qwen3-235B-A22B-FP8',
    name: 'Qwen3 235B A22B',
    description: 'Advanced reasoning model with 235B parameters (22B active)',
    available: true,
    temperature: 0.6,
    top_p: 0.95,
    tokenLimit: 128000,
    parameters: '235B (22B active)',
    architecture: 'Mixture-of-Experts (128 experts)',
    hf_repo: 'Qwen/Qwen3-235B-A22B-FP8',
    aboutContent: `Experience the power of **Qwen3 235B A22B**, a cutting-edge Mixture-of-Experts model with 235B total parameters and 22B active parameters. This advanced model excels in reasoning, instruction-following, and multilingual support, offering seamless switching between thinking and non-thinking modes.

Qwen3 235B A22B delivers superior performance in complex logical reasoning, mathematics, coding, and creative writing, making it ideal for demanding AI applications.`,
    infoContent: `
* ⚡ Instant access to Qwen3 235B A22B with no signup
* 🧠 Supports up to 32K tokens with YaRN scaling up to 131K
* 🌐 Decentralized hosting for lower costs & full control
* 🔍 Optimized for reasoning, coding, and multilingual tasks`,
    thumbnailId: 'llama-3',
    deployUrl: 'https://console.akash.network/templates/akash-network-awesome-akash-Qwen3-235B-A22B-FP8'
  },
  {
    id: 'Qwen3-235B-A22B-Instruct-2507-FP8',
    name: 'Qwen3 235B A22B Instruct 2507',
    description: 'Enhanced reasoning and alignment in a non-thinking model',
    available: true,
    temperature: 0.7,
    top_p: 0.8,
    tokenLimit: 262144,
    parameters: '235B (22B active)',
    architecture: 'Mixture-of-Experts (128 experts, 8 activated)',
    hf_repo: 'Qwen/Qwen3-235B-A22B-Instruct-2507-FP8',
    aboutContent: `Experience **Qwen3 235B A22B Instruct 2507**, the enhanced non-thinking mode version of Qwen3 with significant improvements across all capabilities. This updated model features substantial gains in instruction following, logical reasoning, mathematics, science, coding, and tool usage, along with markedly better alignment with user preferences.

With native 262K context length support and enhanced long-context understanding, this model excels in subjective and open-ended tasks, delivering more helpful responses and higher-quality text generation across multiple languages.`,
    infoContent: `
* ⚡ Enhanced non-thinking mode with improved capabilities
* 🧠 Native 262K context length for extended conversations
* 🌐 Decentralized hosting for lower costs & full control
* 🔍 Superior performance in reasoning, coding, and multilingual tasks`,
    thumbnailId: 'llama-3',
    deployUrl: 'https://console.akash.network/templates/akash-network-awesome-akash-Qwen3-235B-A22B-Instruct-2507-FP8'
  },
  {
    id: 'DeepSeek-R1-0528',
    name: 'DeepSeek R1 0528',
    description: 'Strong Mixture-of-Experts (MoE) LLM',
    available: true,
    temperature: 0.6,
    top_p: 0.95,
    tokenLimit: 64000,
    parameters: '671B',
    architecture: 'Mixture-of-Experts',
    hf_repo: 'deepseek-ai/DeepSeek-R1-0528',
    aboutContent: `Experience **DeepSeek R1 0528**, the latest iteration of DeepSeek's groundbreaking reasoning model. This advanced 671B parameter Mixture-of-Experts (MoE) architecture represents a significant leap forward in AI reasoning capabilities, featuring enhanced chain-of-thought processing and superior problem-solving abilities.

The 0528 version introduces refined training techniques and improved reasoning pathways, making it exceptionally powerful for complex analytical tasks, mathematical reasoning, and multi-step problem solving. Built for professionals who demand the highest level of AI performance.`,
    infoContent: `
* ⚡ Latest DeepSeek R1 0528 with enhanced reasoning capabilities
* 🧠 Advanced chain-of-thought processing with 671B parameters
* 🌐 Decentralized hosting for cost-effective, unrestricted access
* 🔍 Optimized for complex reasoning, analysis, and problem-solving tasks`,
    thumbnailId: 'deepseek',
    deployUrl: 'https://console.akash.network/templates/akash-network-awesome-akash-DeepSeek-R1-0528'
  },
  {
    id: 'meta-llama-Llama-4-Maverick-17B-128E-Instruct-FP8',
    name: 'Llama 4 Maverick 17B 128E',
    description: '400B parameter model (17B active) with 128 experts',
    available: true,
    temperature: 0.6,
    top_p: 0.9,
    tokenLimit: 128000,
    parameters: '400B',
    architecture: 'Mixture-of-Experts (128 experts)',
    hf_repo: 'meta-llama/Llama-4-Maverick-17B-128E-Instruct',
    aboutContent: `Looking to explore Meta's Llama 4 Maverick 17B 128E? AkashChat lets you experience this cutting-edge multimodal language model in real time—no setup required. Powered by a Mixture-of-Experts (MoE) architecture with 128 experts and 17B active parameters per pass, Maverick delivers top-tier performance in reasoning, coding, and multimodal tasks.

AkashChat provides a fast, user-friendly interface to chat with Llama 4 Maverick—leveraging decentralized compute on the Akash Network.`,
    infoContent: `
* ⚡ Instant access to Llama 4 Maverick with no signup
* 🧠 Run on a 1M-token context window with advanced multimodal capabilities
* 🌐 Decentralized hosting for lower costs & full control
* 🔍 Optimized for developers, researchers, and AI enthusiasts`,
    thumbnailId: 'llama-4',
    deployUrl: 'https://console.akash.network/templates/akash-network-awesome-akash-Llama-4-Maverick-17B-128E-Instruct-FP8'
  },
  {
    id: 'nvidia-Llama-3-3-Nemotron-Super-49B-v1',
    name: 'Llama 3.3 Nemotron Super 49B',
    description: 'Great tradeoff between model accuracy and efficiency',
    available: true,
    temperature: 0.6,
    top_p: 0.95,
    tokenLimit: 128000,
    parameters: '49B',
    architecture: 'Optimized Transformer',
    hf_repo: 'nvidia/Llama-3.3-Nemotron-Super-49B-v1',
    aboutContent: `Experience **Llama 3.3 Nemotron Super 49B**—a powerful open-source model that strikes the perfect balance between performance and efficiency. Available now on AkashChat, this high-capacity model delivers excellent results in reasoning, generation, and coding tasks without sacrificing speed.

Powered by NVIDIA's cutting-edge design, Nemotron Super 49B is perfect for developers and researchers looking to maximize output on a flexible, decentralized platform.`,
    infoContent: `
* ⚡ Instant access to Llama 3.3 Nemotron Super 49B with no signup
* 🧠 Supports massive 128K-token context for long-form content  
* 🌐 Decentralized hosting for lower costs & full control
* 🔍 Optimized for developers, researchers, and AI enthusiasts`,
    thumbnailId: 'llama-1',
    deployUrl: 'https://console.akash.network/templates/akash-network-awesome-akash-Llama-3.3-Nemotron-Super-49B-v1'
  },
  {
    id: 'Qwen-QwQ-32B',
    name: 'Qwen QwQ-32B',
    description: 'Medium-sized reasoning model with enhanced performance',
    available: true,
    temperature: 0.6,
    top_p: 0.95,
    tokenLimit: 128000,
    parameters: '32B',
    architecture: 'Reasoning-optimized',
    hf_repo: 'Qwen/QwQ-32B',
    aboutContent: `Unlock the capabilities of **Qwen QwQ-32B**, a versatile reasoning model optimized for both general-purpose and complex tasks. On AkashChat, you get instant access to this medium-sized powerhouse—no setup required.

Qwen QwQ-32B blends fast inference with high accuracy, making it ideal for researchers, developers, and creators pushing the boundaries of LLM capabilities.`,
    infoContent: `
* ⚡ Lightning-fast access with no login  
* 🧠 Long context window (128K tokens) for better coherence 
* 🌐 Decentralized hosting for lower costs & full control
* 🔍 Great for logic, Q&A, and creative content generation`,
    thumbnailId: 'llama-3',
    deployUrl: 'https://console.akash.network/templates/akash-network-awesome-akash-QwQ-32B'
  },
  {
    id: 'Meta-Llama-3-3-70B-Instruct',
    name: 'Llama 3.3 70B',
    description: 'Well-rounded model with strong capabilities',
    available: true,
    temperature: 0.6,
    top_p: 0.9,
    tokenLimit: 128000,
    parameters: '70B',
    architecture: 'Transformer',
    hf_repo: 'meta-llama/Llama-3.3-70B-Instruct',
    aboutContent: `Meet **Llama 3.3 70B**, Meta's well-rounded large model available now on AkashChat for instant access. With strong performance across tasks—reasoning, summarization, coding—this model is a reliable all-rounder for both casual and professional users.

Enjoy top-tier performance and low-latency interaction without needing to configure anything.`,
    infoContent: `
* ⚡ Jump in with zero setup  
* 🧠 Handles long conversations with a 128K token limit  
* 🌐 Cost-effective, censorship-resistant hosting  
* 🔍 Ideal for devs, startups, and AI researchers`,
    thumbnailId: 'llama-2',
    deployUrl: 'https://console.akash.network/templates/akash-network-awesome-akash-Llama-3.3-70B-Instruct'
  },
  {
    id: 'DeepSeek-R1',
    name: 'DeepSeek R1 671B',
    description: 'Strong Mixture-of-Experts (MoE) LLM',
    available: true,
    temperature: 0.6,
    top_p: 0.95,
    tokenLimit: 64000,
    parameters: '671B',
    architecture: 'Mixture-of-Experts',
    hf_repo: 'deepseek-ai/DeepSeek-R1',
    aboutContent: `Tap into the strength of **DeepSeek R1 671B**, one of the most capable Mixture-of-Experts (MoE) models available. Now live on AkashChat, this massive model offers world-class performance on tasks like reasoning, planning, and instruction-following.

Built to scale, DeepSeek R1 uses expert routing to reduce compute while maximizing results—ideal for large-scale AI development.`,
    infoContent: `
* ⚡ Instant access to DeepSeek R1 671B with no signup
* 🧠 Efficient MoE architecture with scalable performance 
* 🌐 Decentralized hosting for lower costs & full control
* 🔍 Built for professionals tackling high-complexity tasks`,
    thumbnailId: 'deepseek',
    deployUrl: 'https://console.akash.network/templates/akash-network-awesome-akash-DeepSeek-R1'
  },
  {
    id: 'Meta-Llama-3-1-405B-Instruct-FP8',
    name: 'Llama 3.1 405B',
    description: 'Most capable model for complex tasks',
    available: true,
    temperature: 0.6,
    top_p: 0.9,
    tokenLimit: 60000,
    parameters: '405B',
    architecture: 'Transformer',
    hf_repo: 'meta-llama/Llama-3.1-405B-Instruct-FP8',
    aboutContent: `Explore the high-performance **Llama 3.1 405B**, Meta's most capable model for complex reasoning, code generation, and advanced natural language tasks. Live on AkashChat, you can access this model instantly—no hardware required.

With 405 billion parameters, this model excels at deep understanding, long-context retention, and high-quality generation for even the most demanding workloads.`,
    infoContent: `
* ⚡ Instant access to Llama 3.1 405B with no signup 
* 🧠 Handles long conversations with a 128K token limit  
* 🌐 Cost-effective, censorship-resistant hosting  
* 🔍 Best for complex enterprise-grade AI tasks`,
    thumbnailId: 'llama-3',
    deployUrl: 'https://console.akash.network/templates/akash-network-awesome-akash-Llama-3.1-405B-FP8'
  },
  {
    id: 'Meta-Llama-3-2-3B-Instruct',
    name: 'Llama 3.2 3B',
    description: 'Fast model for quick responses',
    available: false,
    temperature: 0.6,
    top_p: 0.9,
    tokenLimit: 128000,
    parameters: '3B',
    architecture: 'Transformer',
    hf_repo: 'meta-llama/Llama-3.2-3B-Instruct',
    aboutContent: `Get instant, efficient performance with **Llama 3.2 3B**, a lightweight model ideal for fast, responsive interactions. Perfect for basic tasks, short conversations, and casual use cases, Llama 3.2 3B offers quick results without heavy compute demands.
  
  Accessible through AkashChat, this small but capable model is great for users seeking speed and simplicity on a decentralized platform.`,
    infoContent: `
  * ⚡ Super-fast responses with minimal latency
  * 🧠 128K-token context window for coherent exchanges
  * 🌐 Decentralized hosting ensures full control and lower costs
  * 🔍 Ideal for quick chats, FAQs, and lightweight workloads`,
    thumbnailId: 'llama-3',
    deployUrl: 'https://console.akash.network/templates/akash-network-awesome-akash-Llama-3.2-3B'
  },  
  {
    id: 'Meta-Llama-3-1-8B-Instruct-FP8',
    name: 'Llama 3.1 8B',
    description: 'Efficient model for basic tasks',
    available: false,
    temperature: 0.6,
    top_p: 0.9,
    tokenLimit: 128000,
    parameters: '8B',
    architecture: 'Transformer',
    hf_repo: 'meta-llama/Llama-3.1-8B-Instruct-FP8',
    aboutContent: `Discover the versatility of **Llama 3.1 8B**, a compact yet capable model perfect for daily tasks, chatbots, and lightweight reasoning. Available on AkashChat, Llama 3.1 8B offers a great balance between speed and capability without the need for large-scale compute.
  
  With FP8 optimization, it delivers faster inference and lower memory usage—ideal for quick deployments and fast responses.`,
    infoContent: `
  * ⚡ Fast, efficient model ready for instant interaction
  * 🧠 Supports extended conversations with a 128K-token window
  * 🌐 Cost-effective, decentralized deployment via Akash
  * 🔍 Best for lightweight applications, prototyping, and experimentation`,
    thumbnailId: 'llama-3',
    deployUrl: 'https://console.akash.network/templates/akash-network-awesome-akash-Llama-3.1-8B'
  },
  {
    id: 'mistral',
    name: 'Mistral-7B',
    description: 'Balanced model for general use',
    available: false,
    temperature: 0.7,
    top_p: 0.95,
    tokenLimit: 32768,
    parameters: '7B',
    architecture: 'Sliding Window Attention',
    hf_repo: 'mistral/Mistral-7B-v0.1',
    thumbnailId: 'mistral', 
    aboutContent: `Meet **Mistral-7B**, a lightweight, efficient language model known for its impressive performance across a wide range of general-purpose tasks. Now available on AkashChat, Mistral-7B is designed with sliding window attention for faster, more efficient handling of long sequences.
  
  It's perfect for developers and researchers looking for a compact yet capable model for real-world applications and experiments.`,
    infoContent: `
  * ⚡ Highly efficient with sliding window attention
  * 🧠 Supports context-rich conversations up to 32K tokens
  * 🌐 Decentralized, low-cost deployment options
  * 🔍 Great for summarization, chatbots, and general-purpose AI tasks`,
    deployUrl: 'https://console.akash.network/templates/akash-network-awesome-akash-Mistral-7B'
  },
  {
    id: 'AkashGen',
    name: 'AkashGen',
    description: 'Generate images using AkashGen',
    available: true,
    temperature: 0.85,
    top_p: 1,
    tokenLimit: 12000,
    aboutContent: `AkashGen is a powerful image generation model that leverages the Akash Network for decentralized hosting. It allows you to generate images using a text prompt—no setup required.`,
    infoContent: `
* ⚡ Instant access to AkashGen with no signup
* 🌐 Decentralized hosting for lower costs & full control
* 🔍 Great for image generation and creative content`,
    thumbnailId: 'akash-gen',
  }
];

// in case the `DEFAULT_MODEL` environment variable is not set or set to an unsupported model
export const fallbackModelID = 'Qwen3-235B-A22B-Instruct-2507-FP8';
export const defaultModel = process.env.DEFAULT_MODEL || fallbackModelID; 