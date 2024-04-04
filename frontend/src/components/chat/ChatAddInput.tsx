import React from "react";
import { AccordionButton, Accordion, AccordionPanel, Box, AccordionItem, AccordionIcon } from "@chakra-ui/react";
import { ChatSlider } from "./ChatSlider";


type ChatAddInputProps = {
    modelInfo: {name: string, description: string};
    setTemperature: React.Dispatch<React.SetStateAction<number>>;
    temperature: number;
    maxNewTokens: number;
    setMaxNewTokens: React.Dispatch<React.SetStateAction<number>>;
    topP: number;
    setTopP: React.Dispatch<React.SetStateAction<number>>;
    penalty: number;
    setPenalty: React.Dispatch<React.SetStateAction<number>>;
};

export const ChatAddInput: React.FC<ChatAddInputProps> = ({
    modelInfo,
    setTemperature,
    temperature,
    maxNewTokens,
    setMaxNewTokens,
    topP,
    setTopP,
    penalty,
    setPenalty,
}) => {
    return (
        <Box>
            <Accordion allowToggle>
                <AccordionItem>
                    <h2>
                        <AccordionButton>
                            <Box as="span" flex='1' textAlign='left'>
                                Additional Input
                            </Box>
                            <AccordionIcon />
                        </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                        <ChatSlider headline={"Temperature"} subline={"Higher values produce more diverse outputs"} stepSize={0.05} min={0} max={1} defaultValue={0.9} value={temperature} setValue={setTemperature} />
                        <ChatSlider headline={"Max new tokens"} subline={"The maximum numbers of new tokens"} stepSize={64} min={64} max={2048} defaultValue={256} value={maxNewTokens} setValue={setMaxNewTokens} />
                        <ChatSlider headline={"Top-p (nucleus sampling)"} subline={"Higher values sample more low-probability tokens"} stepSize={0.05} min={0} max={1} defaultValue={0.9} value={topP} setValue={setTopP} />
                        <ChatSlider headline={"Repetition penalty "} subline={"Penalize repeated tokens"} stepSize={0.05} min={1} max={2} defaultValue={1.2} value={penalty} setValue={setPenalty} />
                    </AccordionPanel>
                </AccordionItem>
                <AccordionItem>
                    <h2>
                        <AccordionButton>
                            <Box as="span" flex='1' textAlign='left'>
                                About this model
                            </Box>
                            <AccordionIcon />
                        </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                        {
                            modelInfo.description
                        }
                        This application is running on NVIDIA GPUs leased from the Akash Supercloud.											</AccordionPanel>
                </AccordionItem>
            </Accordion>
        </Box >
    );
};