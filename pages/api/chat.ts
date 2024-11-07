import { ChatBody, Message } from '@/types/chat';
import { DEFAULT_SYSTEM_PROMPT } from '@/utils/app/const';
import { OpenAIError, OpenAIStream } from '@/utils/server';
import tiktokenModel from '@dqbd/tiktoken/encoders/cl100k_base.json';
import { Tiktoken, init } from '@dqbd/tiktoken/lite/init';
// @ts-expect-error
import wasm from '../../node_modules/@dqbd/tiktoken/lite/tiktoken_bg.wasm?module';
import { fallbackModelID, LLMS } from '@/types/llms';

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  try {
    let { model, messages, key, prompt } = (await req.json()) as ChatBody;
    let modelInfo = LLMS[model.id as keyof typeof LLMS];
    
    if (!modelInfo) {
      model = LLMS[fallbackModelID as keyof typeof LLMS];
      modelInfo = LLMS[fallbackModelID as keyof typeof LLMS];
      console.log(` Falling back to model: ${model.id}`);
    }

    await init((imports) => WebAssembly.instantiate(wasm, imports));
    const encoding = new Tiktoken(
      tiktokenModel.bpe_ranks,
      tiktokenModel.special_tokens,
      tiktokenModel.pat_str,
    );

    let promptToSend = prompt;
    if (!promptToSend) {
      promptToSend = DEFAULT_SYSTEM_PROMPT;
    }

    const prompt_tokens = encoding.encode(promptToSend);

    let tokenCount = prompt_tokens.length;
    let messagesToSend: Message[] = [];
    if (messages.length === 1) {
      // include system prompt the message because mistral doesn't support it
      messages[0].content = `${promptToSend} - ${messages[0].content}`;
    }

    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      const tokens = encoding.encode(message.content);

      if (tokenCount + tokens.length + 1000 > modelInfo.tokenLimit) {
        console.log(`Token limit reached: ${tokenCount + tokens.length}`);
        break;
      }
      tokenCount += tokens.length;
      messagesToSend = [message, ...messagesToSend];
    }

    encoding.free();

    if (process.env.INFLUXDB_ENDPOINT && process.env.INFLUXDB_TOKEN) {
      try {
        // log to influxdb api
        await fetch(`${process.env.INFLUXDB_ENDPOINT}/api/v2/write?org=AKT&bucket=logdb&precision=ms`, {
          headers: {
            'Content-Type': 'text/plain',
            Authorization: `Token ${process.env.INFLUXDB_TOKEN}`,
          },
          method: 'POST',
          body: `chatlogs,model=${model.id} value=1`,
        });
      } catch (error) {
        console.error('Failed to log to InfluxDB', error);
      }
    }

    const stream = await OpenAIStream(model, promptToSend, `${key ? key : process.env.API_KEY}`, messagesToSend);

    return new Response(stream);
  } catch (error) {
    console.error(error);
    if (error instanceof OpenAIError) {
      return new Response('Error', { status: 500, statusText: error.message });
    } else {
      return new Response('Error', { status: 500 });
    }
  }
};

export default handler;
