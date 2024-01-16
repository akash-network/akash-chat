import { useEffect, useState } from "react";
import { Flex, Divider, Box, useToast } from "@chakra-ui/react";
import { ChatMessages } from "./ChatMessages";
import { ChatFooter } from "./ChatFooter";
import { ChatOptions } from "./ChatOptions";
import { TRPCClientError, createTRPCProxyClient, httpLink } from "@trpc/client";
import { AppRouter } from "../../misc/trpcTypes";
import { ChatAddInput } from "./ChatAddInput";

export const Chat = ({ modelInfo }: { modelInfo: { name: string, fullname: string, description: string } }) => {
    const defaultMsg: { role: "assistant" | "user"; content: string; }[] = [];

    const [messages, setMessages] = useState<{ role: "assistant" | "user"; content: string; model?:string }[]>(defaultMsg);
    const [processing, setProcessing] = useState(false);
    const [inputMessage, setInputMessage] = useState("");

    const [temperature, setTemperature] = useState(0.9);
    const [maxNewTokens, setMaxNewTokens] = useState(256);
    const [topP, setTopP] = useState(0.9);
    const [penalty, setPenalty] = useState(1.2);

    const toast = useToast()

    // configure TRPCClient
    const trpc = createTRPCProxyClient<AppRouter>({
        links: [
            httpLink({
                url: process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001',
            }),
        ],
    });

    const handleSendMessage = async () => {
        if (processing) {
            toast({ description: 'Please wait for the Job to finish', status: 'error', duration: 4000, isClosable: false })
        }
        if (!inputMessage.trim().length && !processing) {
            return;
        }
        const data = inputMessage;
        setMessages((old) => [...old, { role: "user", content: data }]);
        setInputMessage("");
        await sendTRPCMessages([...messages, { role: "user", content: data }]);
    };

    const sendTRPCMessages = async (data: { role: "assistant" | "user"; content: string; }[]) => {
        const lastMessages = data.slice(-4); //max context for ai is 4 messages
        if (lastMessages.length === 0) {
            return;
        }

        const rpcMessage = {
            model: modelInfo.name,
            messages: lastMessages,
            temperature: temperature.toString(),
            max_tokens: maxNewTokens,
            top_p: topP.toString(),
            repetition_penalty: penalty.toString(),
        };

        setProcessing(true);
        setMessages([...data, { role: "assistant", content: "loading...", model: modelInfo.name }]);
        const response = await trpc.generate.mutate(rpcMessage).catch((err: TRPCClientError<AppRouter>) => {
            console.log(err);
            setMessages([...data]);
            toast({ status: "error", description: err.message, duration: 4000, isClosable: false })
        });
        if (response && response.message) {
            setMessages([...data, { role: "assistant", content: response.message, model: modelInfo.name }]);
            localStorage.setItem("messages", JSON.stringify([...data, { role: "assistant", content: response.message, model: modelInfo.name }]));
        }

        setProcessing(false);
    }


    const handleClear = () => {
        setMessages([]);
        localStorage.setItem("messages", JSON.stringify([]));
    }

    const handleUndo = () => {
        setMessages((old) => [...old.slice(0, -2)]);
    }

    const handleRetry = () => {
        if (messages.length === 0) {
            return;
        }
        if (messages[messages.length - 1].role === "user") {
            sendTRPCMessages(messages);
        } else {
            sendTRPCMessages(messages.slice(0, -1));
        }
    }

    useEffect(() => {
        if (localStorage.getItem("messages")) {
            setMessages(JSON.parse(localStorage.getItem("messages") || ""));
        } else {
            setMessages(defaultMsg);
        }

        return () => {
            localStorage.setItem("messages", JSON.stringify(messages.filter((el) => { return !(el.role === "assistant" && el.content === "loading...") })));
        };
    }, []);

    return (
        <Box>
            <Flex w="100%" h={"80vh"} justify="center" align="center">
                <Flex w="100%" h="90%" flexDir="column">
                    <Divider mt={2} colorScheme="blackAlpha" />
                    <ChatMessages messages={messages} />
                    <Divider mb={2} colorScheme="blackAlpha" />
                    <ChatOptions
                        processing={processing}
                        handleClear={handleClear}
                        handleUndo={handleUndo}
                        handleRetry={handleRetry}
                    />
                    <ChatFooter
                        inputMessage={inputMessage}
                        inputDisabled={processing}
                        setInputMessage={setInputMessage}
                        handleSendMessage={handleSendMessage}
                    />
                </Flex>
            </Flex>
            <Flex w="100%" flexDir="column">
                <ChatAddInput
                    setTemperature={setTemperature}
                    temperature={temperature}
                    maxNewTokens={maxNewTokens}
                    setMaxNewTokens={setMaxNewTokens}
                    topP={topP}
                    setTopP={setTopP}
                    penalty={penalty}
                    setPenalty={setPenalty}
                    modelInfo={modelInfo}
                />
            </Flex>
        </Box>
    );
};