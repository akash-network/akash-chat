import { LLM, LLMID } from '@/types/llms';
import { useTranslation } from 'next-i18next';
import { IconExternalLink } from '@tabler/icons-react';
import { FC } from 'react';

interface Props {
  model: LLM;
  models: LLM[];
  defaultModelId: LLMID;
  onModelChange: (model: LLM) => void;
}

export const ModelSelect: FC<Props> = ({
  model,
  models,
  defaultModelId,
  onModelChange
}) => {
  const { t } = useTranslation('chat');

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
    </div>
  );
};
