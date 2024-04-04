import React from "react";
import { Flex, Button, Textarea } from "@chakra-ui/react";
import ResizeTextarea from "react-textarea-autosize";


export const ChatFooter = ({ inputMessage, inputDisabled, setInputMessage, handleSendMessage }: { inputMessage: string, inputDisabled: boolean, setInputMessage: (message: string) => void, handleSendMessage: () => void }) => {
    return (
        <Flex w="100%" mt="5">
            <Textarea style={{ resize: "none" }} minRows={1} rows={1} maxRows={6} as={ResizeTextarea} maxLength={2000}
                placeholder="Type Something..."
                borderLeftRadius={"lg"}
                borderRightRadius={0}
                onKeyPress={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                    if (e.key === "Enter" && !inputDisabled && e.shiftKey === false) {
                        handleSendMessage();
                    }
                }}
                value={inputMessage}
                onChange={(e: { target: { value: string; }; }) => {
                    if (e.target.value === "\n") {
                        setInputMessage("");
                        return;
                    }
                    setInputMessage(e.target.value)
                }}
                borderColor={'#FFB2B2'}
                focusBorderColor="#ffbaba"
            />
            <Button
                borderLeftRadius={0}
                borderRightRadius={"lg"}
                disabled={inputMessage.trim().length <= 0 || inputMessage.trim().length > 200 || inputDisabled}
                onClick={handleSendMessage}
                isLoading={inputDisabled}
                bg="#ffbaba"
                color="#ce4747"
                _hover={{
                    bg: '#ffb2b2',
                }}
            >
                Send
            </Button>
        </Flex>
    );
};