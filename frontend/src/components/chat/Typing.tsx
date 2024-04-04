import { Box } from '@chakra-ui/react';
import '../../css/typing.css';

export const Typing = () => {

    return (
        <Box className="typing" my={"3"}>
            <span className='dot'></span>
            <span className='dot' id='dot2'></span>
            <span className='dot' id='dot3'></span>
        </Box>
    )
}