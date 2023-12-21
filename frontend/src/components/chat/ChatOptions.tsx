import React from "react";
import { Flex, Button } from "@chakra-ui/react";
import { ArrowBackIcon, RepeatIcon, SmallCloseIcon } from "@chakra-ui/icons";


type ChatOptionsProps = {
    processing: boolean;
    handleRetry: () => void;
    handleUndo: () => void;
    handleClear: () => void;
};

export const ChatOptions: React.FC<ChatOptionsProps> = ({
    processing,
    handleRetry,
    handleUndo,
    handleClear,
}) => {
    return (
        <Flex justifyContent="end">
            <Button
                leftIcon={<SmallCloseIcon />}
                size={"xs"}
                mx="1"
                borderRadius="lg"
                disabled={processing}
                onClick={handleClear}
                bg="#F0F0F0"
                color='#687076'
                _hover={{
                    bg: 'lightgray',
                }}
            >
                Clear All
            </Button>
            <Button
                leftIcon={<ArrowBackIcon />}
                size={"xs"}
                mx="1"
                borderRadius="lg"
                disabled={processing}
                onClick={handleUndo}
                bg="#F0F0F0"
                color='#687076'
                _hover={{
                    bg: 'lightgray',
                }}
            >
                Undo
            </Button>
            <Button
                leftIcon={<RepeatIcon />}
                size={"xs"}
                mx="1"
                borderRadius="lg"
                disabled={processing}
                onClick={handleRetry}
                bg="#F0F0F0"
                color='#687076'
                _hover={{
                    bg: 'lightgray',
                }}
            >
                Retry
            </Button>
        </Flex>
    );
};