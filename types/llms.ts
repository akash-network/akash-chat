export interface LLM {
  id: string;
  name: string;
  maxLength: number; // maximum length of a message
  tokenLimit: number;
}

export enum LLMID {
  MISTRAL = 'mistral',
  MIXTRAL = 'mixtral',
  DOLPHINMIXTRAL = 'dolphin-mixtral',
  NOUSHERMESMIXTRAL = 'nous-hermes2-mixtral',
  //MIXTRAL8X22B = 'mixtral-8x22b',
  LLAMA38B = 'llama3-8b',
}

// in case the `DEFAULT_MODEL` environment variable is not set or set to an unsupported model
export const fallbackModelID = LLMID.LLAMA38B;

export const LLMS: Record<LLMID, LLM> = {
  [LLMID.MISTRAL]: {
    id: LLMID.MISTRAL,
    name: 'Mistral-7B',
    maxLength: 12000,
    tokenLimit: 4000,
  },
  [LLMID.NOUSHERMESMIXTRAL]: {
    id: LLMID.NOUSHERMESMIXTRAL,
    name: 'Nous Hermes 2 Mixtral',
    maxLength: 12000,
    tokenLimit: 4000,
  },
  [LLMID.MIXTRAL]: {
    id: LLMID.MIXTRAL,
    name: 'Mixtral',
    maxLength: 12000,
    tokenLimit: 4000,
  },
  [LLMID.DOLPHINMIXTRAL]: {
    id: LLMID.DOLPHINMIXTRAL,
    name: 'Dolphin Mixtral',
    maxLength: 12000,
    tokenLimit: 4000,
  },/*
  [LLMID.MIXTRAL8X22B]: {
    id: LLMID.MIXTRAL8X22B,
    name: 'Mixtral 8x22B',
    maxLength: 12000,
    tokenLimit: 4000,
  },*/
  [LLMID.LLAMA38B]: {
    id: LLMID.LLAMA38B,
    name: 'Llama3 8B',
    maxLength: 12000,
    tokenLimit: 4000,
  },
};
