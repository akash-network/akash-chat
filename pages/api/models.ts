import { LLM, LLMID, LLMS } from '@/types/llms';
import { API_HOST } from '@/utils/app/const';

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  try {
    const { key } = (await req.json()) as {
      key: string;
    };

    const response = await fetch(`${API_HOST}/v1/models`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key ? key : process.env.API_KEY}`,
      },
    });

    if (response.status === 401) {
      return new Response(response.body, {
        status: 500,
        headers: response.headers,
      });
    } else if (response.status !== 200) {
      console.error(
        `API returned an error ${response.status
        }: ${await response.text()}`,
      );
      console.log(response);

      throw new Error('API returned an error');
    }

    const json = await response.json();

    const models: LLM[] = json.data
      .map((model: any) => {
        for (const [key, value] of Object.entries(LLMID)) {
          if (value === model.id) {
            return {
              id: model.id,
              name: LLMS[value].name,
            };
          }
        }
      })
      .filter(Boolean);

    return new Response(JSON.stringify(models), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
};

export default handler;
