import {
    Box,
    Container,
    Stack,
    Center
} from '@chakra-ui/react';
import { PoweredByAkashLogo } from './logos/powered-by-akash-logo';
import { version } from '../misc/consts';


export default function Footer() {
    return (
        <Box
            color={'gray.200'}
            opacity={0.5}>
            <Container
                my={3}
                as={Stack}
                maxW={'6xl'}
                py={4}
                spacing={4}
                justify={'center'}
                align={'center'}>
                <Stack direction={'column'} spacing={6}>
                    <Box
                        minH={50}
                        maxH={50}
                        w="full"
                        h="full"
                    >
                        <PoweredByAkashLogo light={false} alt='Powered by Akash Network' />
                    </Box>
                    <Box
                        minH={50}
                        maxH={50}
                        w="full"
                        h="full"
                    ><Center>
                            {version}
                        </Center>
                    </Box>
                </Stack>
            </Container>
        </Box>
    );
}