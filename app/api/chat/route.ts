import { createOpenAI } from '@ai-sdk/openai';
import { streamText, generateText, createUIMessageStream, createUIMessageStreamResponse, toUIMessageStream, isTextUIPart, type UIMessage } from 'ai';
import { NextRequest } from 'next/server';
import cl100k_base from "tiktoken/encoders/cl100k_base.json";
import { Tiktoken } from "tiktoken/lite";

import { apiEndpoint, apiKey, imgGenFnModel, DEFAULT_SYSTEM_PROMPT } from '@/app/config/api';
import { defaultModel } from '@/app/config/models';
import { withSessionAuth, getOptionalSession } from '@/lib/auth';
import { getAvailableModelsForUser } from '@/lib/models';
import { checkTokenLimit, incrementTokenUsageWithMultiplier, getClientIP, getRateLimitConfigForUser, storeConversationTokens } from '@/lib/rate-limit';
import { generateImageTool, startImageGeneration } from '@/lib/tools';

if (!apiKey) {
  throw new Error('API_KEY is not set in environment variables');
}

// Text averages ~4 characters per token, so anything longer than this can't fit the model and isn't worth tokenizing
const MAX_CHARS_PER_TOKEN = 6;

interface TextMessage {
  role: 'user' | 'assistant';
  content: string;
}

// BPE cost grows quadratically with the length of an unbroken run of letters, so count in fixed-size chunks
function countTokens(encoding: Tiktoken, text: string): number {
  let count = 0;
  for (let i = 0; i < text.length; i += 500) {
    count += encoding.encode(text.slice(i, i + 500)).length;
  }
  return count;
}

function createOpenAIWithRateLimit(apiKey: string) {
  return createOpenAI({
    baseURL: apiEndpoint,
    apiKey: apiKey,
    // Inject reasoning content into the stream
    fetch: async (url, options) => {
      // Inject required kwargs for DeepSeek V3.1 to enable thinking. Workaround for old ai sdk version.
      const body = JSON.parse(options!.body as string || '{}');
      if (body.model.includes('deepseek-ai/DeepSeek-V3.') || body.model === 'DeepSeek-V3.1') {
        options!.body = JSON.stringify({
          ...body,
          chat_template_kwargs: {
            thinking: true
          }
        });
      }

      const response = await fetch(url, options);

      if (response.headers.get('content-type')?.includes('text/event-stream')) {
        let reasoningBuffer = '';
        let isFirstContent = true;

        const transformStream = new TransformStream({
          transform(chunk, controller) {
            const chunkText = new TextDecoder().decode(chunk);
            const lines = chunkText.split('\n');
            const modifiedLines: string[] = [];

            for (const line of lines) {
              if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                try {
                  const data = JSON.parse(line.slice(6));

                  if (data.choices?.[0]?.delta?.reasoning_content) {
                    reasoningBuffer += data.choices[0].delta.reasoning_content;
                  }

                  if (data.choices?.[0]?.delta?.content && isFirstContent && reasoningBuffer) {
                    isFirstContent = false;

                    const reasoningChunk = {
                      ...data,
                      choices: [{
                        ...data.choices[0],
                        delta: {
                          content: `<think>\n${reasoningBuffer}\n</think>\n\n`,
                          role: data.choices[0].delta.role
                        }
                      }]
                    };

                    modifiedLines.push(`data: ${JSON.stringify(reasoningChunk)}`);
                    modifiedLines.push('');
                  }

                  modifiedLines.push(line);

                } catch (e) {
                  modifiedLines.push(line);
                }
              } else {
                modifiedLines.push(line);
              }
            }
            
            controller.enqueue(new TextEncoder().encode(modifiedLines.join('\n')));
          }
        });

        return new Response(response.body?.pipeThrough(transformStream), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      }

      return response;
    }
  });
}

const openaiClient = createOpenAIWithRateLimit(apiKey);

async function handlePostRequest(req: NextRequest) {
  const session = await getOptionalSession(req);
  const isAuthenticated = !!session?.user;

  const isAccessTokenRequired = process.env.ACCESS_TOKEN && process.env.ACCESS_TOKEN.trim() !== '';
  let rateLimitIdentifier: string | null = null;
  
  const shouldApplyRateLimit = !isAccessTokenRequired;

  if (shouldApplyRateLimit) {
    const userId = isAuthenticated && session?.user?.sub ? session.user.sub : null;

    rateLimitIdentifier = userId || getClientIP(req);
    
    const rateLimitConfig = await getRateLimitConfigForUser(userId);
    const rateLimit = await checkTokenLimit(rateLimitIdentifier!, rateLimitConfig);
    
    if (rateLimit.blocked) {
      const message = isAuthenticated 
        ? `You've reached your usage limit for this time period. Please try again later.`
        : `You've reached your usage limit for this time period. Sign in for higher limits.`;
      
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message,
          resetTime: rateLimit.resetTime.toISOString(),
          requiresVerification: false,
          tier: isAuthenticated ? 'authenticated' : 'anonymous'
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-TokenLimit-Reset': Math.ceil(rateLimit.resetTime.getTime() / 1000).toString(),
          },
        }
      );
    }
  }

  const body = await req.json();
  const { system, context } = body;
  // Only forward the text of user and assistant turns; file parts would make the AI SDK fetch URLs server-side
  const messages: TextMessage[] = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m: UIMessage) => (m?.role === 'user' || m?.role === 'assistant') && Array.isArray(m.parts))
    .map((m: UIMessage) => ({
      role: m.role,
      content: m.parts.filter(isTextUIPart).map(part => part.text).join(''),
    }));

  if (messages.length === 0) {
    return new Response('No valid messages provided', {
      status: 400,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }
  const temperature = body.temperature ? Number(body.temperature) : undefined;
  const topP = body.topP ? Number(body.topP) : undefined;
  let { model } = body;
  const normalizeModel = (model: any) => ({
    model_id: model.model_id || model.id,
    token_limit: model.token_limit || model.tokenLimit,
    temperature: model.temperature,
    top_p: model.top_p,
  });

  const userId = isAuthenticated && session?.user?.sub ? session.user.sub : null;

  const allModels = await getAvailableModelsForUser(userId);
  const dbModel = allModels.find(m => m.model_id === model);

  if (!dbModel) {
    return new Response(
      JSON.stringify({
        error: 'Model not available',
        message: `The model "${model}" is not available for your account tier. Please select a different model.`,
        available_models: allModels.map(m => ({ id: m.model_id, name: m.name }))
      }),
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  const selectedModel = normalizeModel(dbModel);
  const tokenLimit = selectedModel?.token_limit || 128000;
  const maxChars = tokenLimit * MAX_CHARS_PER_TOKEN;
  const systemPrompt = system || "You are a helpful assistant.";

  if (systemPrompt.length > maxChars) {
    return new Response('Your system prompt is too long for this model.', {
      status: 400,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  }

  const encoding = new Tiktoken(
    cl100k_base.bpe_ranks,
    cl100k_base.special_tokens,
    cl100k_base.pat_str
  );

  let tokenCount = countTokens(encoding, systemPrompt);
  let messagesToSend: TextMessage[] = [];

  if (context) {
    for (const file of context) {
      const tokens = file.content.length > maxChars ? Infinity : countTokens(encoding, file.content);
      if (tokenCount + tokens + 1000 > tokenLimit) {
        return new Response('Your files have too much content for this model. Please remove some files or try a different model.', {
          status: 400,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
          },
        });
      }
      tokenCount += tokens;
    }
  }

  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    const tokens = message.content.length > maxChars ? Infinity : countTokens(encoding, message.content);

    if (tokenCount + tokens + 1000 > tokenLimit) {
      // If we haven't added any messages yet, we need to include at least the last message
      // even if it's too long, to avoid empty messages array
      if (messagesToSend.length === 0) {
        const availableTokens = tokenLimit - tokenCount - 1000;
        const errorMessage = "[Message too long for this model. Please try with a shorter message or a different model.]";

        if (availableTokens > 100) {
          const maxContentTokens = availableTokens - 50;
          const truncatedContent = message.content.slice(0, Math.floor(maxContentTokens * 3.5));
          messagesToSend = [{
            ...message,
            content: truncatedContent + "\n\n[Message truncated due to length]"
          }];
        } else {
          // If we can't fit even a truncated message, return an error response immediately
          return new Response(errorMessage, {
            status: 400,
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
            },
          });
        }
      }
      break;
    }
    tokenCount += tokens;
    messagesToSend = [message, ...messagesToSend];
  }

  if (context) {
    for (const file of context) {
      messagesToSend.unshift({
        role: 'user',
        content: `This is the content of the file ${file.name}: ${file.content}`
      });
    }
  }

  if (shouldApplyRateLimit && rateLimitIdentifier) {
    try {
      await storeConversationTokens(
        rateLimitIdentifier, 
        tokenCount, 
        selectedModel?.token_limit || 128000
      );
    } catch (error) {
      console.error('Failed to store conversation tokens:', error);
    }
  }

  encoding.free();

  if (model === 'AkashGen') {
    try {
      const smallModelId = imgGenFnModel || 'Meta-Llama-3-3-70B-Instruct';
      const smallResponse = await generateText({
        model: openaiClient.chat(smallModelId),
        messages: messagesToSend.slice(-3),
        instructions: "Always enhance the user's image request by creating a descriptive image prompt in order to generate a detailed, high-quality image with Stable Diffusion 3.5. Only use the generateImage tool if the user asks for an image. To decide if the user asked for an image, messages but focus on the last one. When asked to generate images, you will use the generateImage tool.",
        tools: {
          generateImage: generateImageTool
        },
        temperature: temperature || selectedModel?.temperature,
        topP: topP || selectedModel?.top_p
      });

      if (shouldApplyRateLimit && rateLimitIdentifier && smallResponse.usage) {
        const totalTokens = (smallResponse.usage.inputTokens ?? 0) + (smallResponse.usage.outputTokens ?? 0);
        if (totalTokens > 0) {
          try {
            const userId = isAuthenticated && session?.user?.sub ? session.user.sub : null;
            const rateLimitConfig = await getRateLimitConfigForUser(userId);
            await incrementTokenUsageWithMultiplier(rateLimitIdentifier, totalTokens, model, rateLimitConfig);
          } catch (error) {
            console.error('Failed to track token usage for image generation:', error);
          }
        }
      }

      // Calls that fail validation come back as dynamic tool calls with unvalidated input, so only accept a typed one
      const imageCall = smallResponse.toolCalls.find(call => call.toolName === 'generateImage' && !call.dynamic);

      if (imageCall && !imageCall.dynamic) {
        const imageResult = await startImageGeneration(imageCall.input);
        const imageTag = `<image_generation> jobId='${imageResult.jobId}' prompt='${String(imageResult.prompt).replace(/'/g, "\\'")}' negative='${String(imageResult.negative || '').replace(/'/g, "\\'")}'</image_generation>`;

        return createUIMessageStreamResponse({
          stream: createUIMessageStream({
            execute: ({ writer }) => {
              writer.write({ type: 'start' });
              writer.write({ type: 'text-start', id: 'image' });
              writer.write({ type: 'text-delta', id: 'image', delta: imageTag });
              writer.write({ type: 'text-end', id: 'image' });
              writer.write({ type: 'finish', finishReason: 'stop' });
            },
          }),
        });
      }

      model = 'Meta-Llama-3-3-70B-Instruct';
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Error generating image',
          message: error instanceof Error ? error.message : String(error),
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  }

  const apiModelId = dbModel.api_id || dbModel.model_id || defaultModel;

  const result = streamText({
    model: openaiClient.chat(apiModelId),
    messages: messagesToSend,
    instructions: system || DEFAULT_SYSTEM_PROMPT,
    temperature: temperature || selectedModel?.temperature,
    topP: topP || selectedModel?.top_p,
  });

  Promise.all([result.usage, result.text]).then(async ([usage, text]) => {
    if (shouldApplyRateLimit && rateLimitIdentifier) {
      const reportedTokens = (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0);
      // Upstreams that don't send usage while streaming leave it empty, so fall back to the local prompt count plus an estimate for the reply
      const totalTokens = reportedTokens > 0 ? reportedTokens : tokenCount + Math.ceil(text.length / 4);
      try {
        const userId = isAuthenticated && session?.user?.sub ? session.user.sub : null;
        const rateLimitConfig = await getRateLimitConfigForUser(userId);
        await incrementTokenUsageWithMultiplier(rateLimitIdentifier, totalTokens, model, rateLimitConfig);
      } catch (error) {
        console.error('Failed to track token usage:', error);
      }
    }
  }).catch(error => {
    console.error('Failed to get usage data:', error);
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      onError: error => {
        if (error instanceof Error) {
          if (error.name === 'OpenAIError') {
            if (error.message.includes('Rate limit')) {
              return 'Rate limit exceeded. Please try again later.';
            } else if (error.message.includes('Invalid API key')) {
              return 'Authentication failed. Please check your API key.';
            } else if (error.message.includes('context length')) {
              return 'The conversation is too long. Please start a new chat.';
            }
          }
          return error.message;
        }
        return String(error);
      },
    }),
  });
}

export const POST = withSessionAuth(handlePostRequest);
