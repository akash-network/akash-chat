import '@/styles/globals.css';
import { appWithTranslation } from 'next-i18next';
import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { GoogleTagManager } from '@next/third-parties/google';

const inter = Inter({ subsets: ['latin'] });

function App({ Component, pageProps }: AppProps<{}>) {
  return (
    <div className={inter.className}>
      <Toaster />
      <Component {...pageProps} />
      <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!}/>
    </div>
  );
}

export default appWithTranslation(App);
