import { IconDots, IconRobot } from '@tabler/icons-react';
import { FC } from 'react';
import { AkashSignLogo } from '../Logos/akash-sign-logo';

interface Props {}

export const ChatLoader: FC<Props> = () => {
  return (
    <div
      className="group border-b border-black/10 bg-gray-50 text-gray-800 dark:border-gray-900/50 dark:bg-[#333d3d3d] dark:text-gray-100"
      style={{ overflowWrap: 'anywhere' }}
    >
      <div className="m-auto flex gap-4 p-4 text-base md:max-w-2xl md:gap-6 md:py-6 lg:max-w-2xl lg:px-0 xl:max-w-3xl">
        <div className="min-w-[40px] text-right font-bold">
          <AkashSignLogo className="w-8 h-8" />
        </div>
        <IconDots className="animate-pulse" />
      </div>
    </div>
  );
};
