import { useEffect, useRef, useState } from "react";
import { Avatar, Box, Button, Flex, Heading, Hide, Tooltip, useClipboard } from "@chakra-ui/react";
import { Typing } from "./Typing";
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { CopyIcon } from "@chakra-ui/icons";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { AkashLogoRed } from "../logos/akash-logo-red";
import { models } from "../../misc/consts";


interface ChatMessagesProps {
    messages: { role: string; content: string, model?: string }[];
}

export const ChatMessages = ({ messages }: ChatMessagesProps) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <Flex w="100%" h="100%" overflowY="scroll" flexDirection="column" p="3">
            {messages.map((el, index) => {
                if (el.role === "user") {
                    return (
                        <Flex key={index} w="100%">
                            <Hide below='md'>
                                <Avatar
                                    bg="#F0F0F0"
                                    p="3"
                                    icon={<AkashLogoRed />}
                                ></Avatar>
                            </Hide>
                            <Box
                                borderRadius="lg"
                                bg="#F0F0F0"
                                my="1"
                                mx="1"
                                p="5"
                                color={'gray.500'}
                            >
                                <Heading as='h5' size='sm'>You</Heading>
                                <Markdown
                                    children={el.content}
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        pre: (pre) => {
                                            const codeChunk = (pre as any).node.children[0].children[0].value as string;

                                            // eslint-disable-next-line react-hooks/rules-of-hooks
                                            const [copyTip, setCopyTip] = useState("Copy code");
                                            // eslint-disable-next-line react-hooks/rules-of-hooks
                                            const { onCopy } = useClipboard(codeChunk);

                                            return (
                                                <Box>
                                                    <Flex justifyContent={'end'}>
                                                        <Tooltip label={copyTip}>
                                                            <Button onClick={async () => {
                                                                setCopyTip("Copied");
                                                                onCopy();
                                                                await new Promise((resolve) => setTimeout(resolve, 500));
                                                                setCopyTip(`Copy code`);
                                                            }}
                                                            >
                                                                <CopyIcon />
                                                            </Button>
                                                        </Tooltip>
                                                    </Flex>
                                                    <pre {...pre}></pre>
                                                </Box>
                                            );
                                        },
                                        code(props) {
                                            const { children, className } = props
                                            const match = /language-(\w+)/.exec(className || '')

                                            return (
                                                <SyntaxHighlighter
                                                    value={children}
                                                    lineProps={{ style: { wordBreak: 'break-all', whiteSpace: 'pre-wrap' } }}
                                                    wrapLines={true}
                                                    PreTag="div"
                                                    children={String(children).replace(/\n$/, '')}
                                                    language={match ? match[1] : 'js'}
                                                    style={atomDark}
                                                />
                                            )
                                        }
                                    }}
                                />
                            </Box>
                        </Flex>
                    );
                } else {
                    if (el.content === "loading...") {
                        return (
                            <Flex key={index} w="100%">
                                <Hide below='md'>
                                    <Avatar
                                        name={models.find((model) => { return model.name === el.model })?.chatname ?? "Mistral 7B"}
                                        src={models.find((model) => { return model.name === el.model })?.logo ?? "/mistral-logo.png"}
                                        p={"9px"}
                                        bg="#F0F0F0"
                                    ></Avatar>
                                </Hide>
                                <Box
                                    borderRadius="lg"
                                    bg="#F0F0F0"
                                    my="1"
                                    mx="1"
                                    p="5"
                                >
                                    <Heading as='h5' size='sm'>{models.find((model) => { return model.name === el.model })?.chatname ?? "Mistral 7B"}</Heading>
                                    <Typing />
                                </Box>
                            </Flex>
                        );
                    } else {
                        return (
                            <Flex key={index} w="100%">
                                <Hide below='md'>
                                    <Avatar
                                        name={models.find((model) => { return model.name === el.model })?.chatname ?? "Mistral 7B"}
                                        src={models.find((model) => { return model.name === el.model })?.logo ?? "/mistral-logo.png"}
                                        p={"9px"}
                                        bg="#F0F0F0"
                                    ></Avatar>
                                </Hide>
                                <Box
                                    borderRadius="lg"
                                    bg="#F0F0F0"
                                    my="1"
                                    mx="1"
                                    p="5"
                                >
                                    <Heading as='h5' size='sm'>{models.find((model) => { return model.name === el.model })?.chatname ?? "Mistral 7B"}</Heading>
                                    <Markdown
                                        children={el.content}
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            pre: (pre) => {
                                                const codeChunk = (pre as any).node.children[0].children[0].value as string;

                                                // eslint-disable-next-line react-hooks/rules-of-hooks
                                                const [copyTip, setCopyTip] = useState("Copy code");
                                                // eslint-disable-next-line react-hooks/rules-of-hooks
                                                const { onCopy } = useClipboard(codeChunk);


                                                return (
                                                    <Box>
                                                        <Flex justifyContent={'end'}>
                                                            <Tooltip label={copyTip}>
                                                                <Button onClick={async () => {
                                                                    setCopyTip("Copied");
                                                                    onCopy();
                                                                    await new Promise((resolve) => setTimeout(resolve, 500));
                                                                    setCopyTip(`Copy code`);
                                                                }}
                                                                >
                                                                    <CopyIcon />
                                                                </Button>
                                                            </Tooltip>
                                                        </Flex>
                                                        <pre {...pre}></pre>
                                                    </Box>
                                                );
                                            },
                                            code(props) {
                                                const { children, className } = props
                                                const match = /language-(\w+)/.exec(className || '')

                                                return (
                                                    <SyntaxHighlighter
                                                        value={children}
                                                        lineProps={{ style: { wordBreak: 'break-all', whiteSpace: 'pre-wrap' } }}
                                                        wrapLines={true}
                                                        PreTag="div"
                                                        children={String(children).replace(/\n$/, '')}
                                                        language={match ? match[1] : 'js'}
                                                        style={atomDark}
                                                    />
                                                )
                                            }
                                        }}
                                    />
                                </Box>
                            </Flex>
                        );
                    }
                }
            })}
            <div ref={messagesEndRef} />
        </Flex>
    );
};