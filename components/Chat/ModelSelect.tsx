import { LLM, LLMID } from '@/types/llms';
import { useTranslation } from 'next-i18next';
import { IconExternalLink, IconEdit, IconChevronDown } from '@tabler/icons-react';
import { FC, useState } from 'react';
import { DEFAULT_SYSTEM_PROMPT } from '@/utils/app/const';

interface Props {
  model: LLM;
  models: LLM[];
  defaultModelId: LLMID;
  onModelChange: (model: LLM) => void;
  systemPrompt: string;
  onSystemPromptChange: (prompt: string) => void;
}

export const ModelSelect: FC<Props> = ({
  model,
  models,
  defaultModelId,
  onModelChange,
  systemPrompt,
  onSystemPromptChange,
}) => {
  const { t } = useTranslation('chat');
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [tempPrompt, setTempPrompt] = useState(systemPrompt);
  const MAX_CHARS = 2000;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSystemPromptChange(tempPrompt);
      (e.target as HTMLTextAreaElement).blur();
    }
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTempPrompt(DEFAULT_SYSTEM_PROMPT);
    onSystemPromptChange(DEFAULT_SYSTEM_PROMPT);
  };

  // Function to get truncated system prompt
  const getTruncatedPrompt = (prompt: string) => {
    return prompt.length > 60 ? prompt.substring(0, 60) + '...' : prompt;
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex flex-col">
        <label className="mb-2 text-left text-neutral-700 dark:text-neutral-400">
          {t('Model')}
        </label>
        <div className="w-full rounded-lg border border-neutral-200 bg-transparent pr-2 text-neutral-900 dark:border-neutral-600 dark:text-white">
          <select
            className="w-full bg-transparent p-2"
            placeholder={t('Select a model') || ''}
            value={model?.id || defaultModelId}
            onChange={(e) => {
              onModelChange(
                models.find((model) => model.id === e.target.value) as LLM,
              );
            }}
          >
            {models.map((model) => (
              <option
                key={model.id}
                value={model.id}
                className="dark:bg-[#1c1c1c] dark:text-white"
              >
                {model.id === defaultModelId
                  ? `Default (${model.name})`
                  : model.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col border-t pt-4 mt-4">
        <div 
          className="flex items-center cursor-pointer" 
          onClick={() => setShowSystemPrompt(!showSystemPrompt)}
        >
          <label className="text-sm font-medium text-neutral-700 dark:text-neutral-400 mr-2">
            {'System Prompt'}
          </label>
        </div>

        {!showSystemPrompt ? (
          <div 
            className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 cursor-pointer group flex items-center"
            onClick={() => setShowSystemPrompt(true)}
          >
            <span className="truncate flex-1">{getTruncatedPrompt(systemPrompt)}</span>
            <IconEdit 
              size={18} 
              className="ml-2 text-neutral-400 group-hover:text-neutral-500 dark:text-neutral-500 dark:group-hover:text-neutral-400"
            />
          </div>
        ) : (
          <div className="mt-2 transition-all">
            <textarea
              className={`w-full h-32 rounded-lg border bg-transparent px-4 py-2 text-neutral-900 dark:text-white transition-colors duration-200`}
              value={tempPrompt}
              onChange={(e) => setTempPrompt(e.target.value.slice(0, MAX_CHARS))}
              onKeyDown={handleKeyDown}
              placeholder={t('Enter system prompt... (Press Enter to save)') || 'Enter system prompt... (Press Enter to save)'}
              maxLength={MAX_CHARS}
            />
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  {tempPrompt.length}/{MAX_CHARS}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-400"
                  onClick={handleReset}
                >
                  {t('Reset to default')}
                </button>
                <button
                  className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-400"
                  onClick={() => setShowSystemPrompt(false)}
                >
                  <IconChevronDown size={18} className="transform rotate-180" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
