import React from "react";
import { Slider, SliderTrack, SliderFilledTrack, Tooltip, SliderThumb, Text, Box, Flex, } from "@chakra-ui/react";

interface ChatSliderProps {
    stepSize: number;
    min: number;
    max: number;
    defaultValue: number;
    headline: string;
    subline: string;
    value: number;
    setValue: React.Dispatch<React.SetStateAction<number>>;
}

export const ChatSlider: React.FC<ChatSliderProps> = ({ stepSize, min, max, defaultValue, headline, subline, value, setValue }) => {
    const [showTooltip, setShowTooltip] = React.useState(false);


    return (
        <Box p={3} borderRadius={"lg"} width={'100%'}>
            <Text fontSize='sm'>{headline}</Text>

            <Flex>
                <Text fontSize='xs' flex={1}>{subline}</Text>
                <Box bg={'#FFBABA'} w={'33px'}>
                    <Text fontSize='xs' textAlign={'center'}>{value}</Text>
                </Box>
            </Flex>
            <Slider
                id='slider'
                defaultValue={defaultValue}
                min={min}
                max={max}
                step={stepSize}
                onChange={(v) => {
                    setValue(v);
                }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                <SliderTrack>
                    <SliderFilledTrack bg={'black'} />
                </SliderTrack>
                <Tooltip
                    hasArrow
                    bg={'#FFB2B2'}
                    color='black'
                    placement='top'
                    isOpen={showTooltip}
                    label={`${value}`}
                >
                    <SliderThumb />
                </Tooltip>
            </Slider>
        </Box>
    );
};