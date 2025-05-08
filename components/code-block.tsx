import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
    node: React.ReactNode;
    inline: boolean;
    className: string;
    children: React.ReactNode;
}

export function CodeBlock({
    node,
    inline,
    className,
    children,
    ...props
}: CodeBlockProps) {
    const [copied, setCopied] = useState(false);
    const isCodeBlock = !inline && className?.includes('language-');
    const match = /language-(\w+)/.exec(className || '');
    const lang = match ? match[1] : '';
    const codeContent = String(children)
        .replace(/\n$/, '') // Remove trailing newline
        .replace(/^`|`$/g, '');

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText(codeContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (isCodeBlock) {
        return (
            <div className="not-prose flex flex-col">
                <div className="relative">
                    <div className="absolute right-2 top-2 flex items-center gap-2">
                        <button
                            onClick={copyToClipboard}
                            className="p-1.5 rounded-lg hover:bg-zinc-700/75 transition-colors"
                            aria-label="Copy code"
                        >
                            {copied ? (
                                <Check className="h-4 w-4 text-green-400" />
                            ) : (
                                <Copy className="h-4 w-4 text-gray-400" />
                            )}
                        </button>
                        {lang && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                {lang}
                            </div>
                        )}
                    </div>
                    <SyntaxHighlighter
                        {...props}
                        style={vscDarkPlus}
                        language={lang}
                        PreTag="div"
                        className="!my-0 !bg-zinc-900 !p-4 border !border-zinc-200 dark:!border-zinc-700 rounded-xl text-sm"
                        showLineNumbers={true}
                        wrapLines={true}
                        wrapLongLines={true}
                    >
                        {codeContent}
                    </SyntaxHighlighter>
                </div>
            </div>
        );
    }

    return (
        <code
            className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-1.5 py-0.5 rounded font-mono text-[0.875em]"
            {...props}
        >
            {codeContent}
        </code>
    );
} 
