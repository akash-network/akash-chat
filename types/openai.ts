export interface OpenAIModel {
  id: string;
  name: string;
  maxLength: number; // maximum length of a message
  tokenLimit: number;
}

export enum OpenAIModelID {
  MISTRAL = 'mistral',
  MIXTRAL = 'mixtral',
  DOLPHINMIXTRAL = 'dolphin-mixtral',
  NOUSHERMESMIXTRAL = 'nous-hermes2-mixtral',
}

// in case the `DEFAULT_MODEL` environment variable is not set or set to an unsupported model
export const fallbackModelID = OpenAIModelID.MISTRAL;

export const OpenAIModels: Record<OpenAIModelID, OpenAIModel> = {
  [OpenAIModelID.MISTRAL]: {
    id: OpenAIModelID.MISTRAL,
    name: 'Mistral-7B',
    maxLength: 12000,
    tokenLimit: 4000,
  },
  [OpenAIModelID.NOUSHERMESMIXTRAL]: {
    id: OpenAIModelID.NOUSHERMESMIXTRAL,
    name: 'Nous Hermes 2 Mixtral',
    maxLength: 12000,
    tokenLimit: 4000,
  },
  [OpenAIModelID.MIXTRAL]: {
    id: OpenAIModelID.MIXTRAL,
    name: 'Mixtral',
    maxLength: 12000,
    tokenLimit: 4000,
  },
  [OpenAIModelID.DOLPHINMIXTRAL]: {
    id: OpenAIModelID.DOLPHINMIXTRAL,
    name: 'Dolphin Mixtral',
    maxLength: 12000,
    tokenLimit: 4000,
  },
};
