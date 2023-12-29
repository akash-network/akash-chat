import './scss/fonts.scss'
import {
	Box,
	Flex,
	Stack,
	VStack,
	ChakraProvider,
	Link,
	Button,
	Container,
} from '@chakra-ui/react'
import { useState } from "react";
import Footer from "./components/footer";
import { Chat } from "./components/chat/Chat"
import { Select } from "chakra-react-select";
import { AkashChatLogo } from "./components/logos/akash-chat-logo"
import { modelOptions, models } from "./misc/consts"
import { themeExtended } from './misc/styles';



export const App = () => {
	const [model, setModel] = useState('mistral')

	return (
		<ChakraProvider theme={themeExtended}>
			<Container
				maxW={'3xl'}>
				<Flex w={'full'} justifyContent={'center'}>
					<AkashChatLogo w={["15em", "24em", "31em"]} p={{ base: 4, md: 8, lg: 8 }} />
				</Flex>
				<Stack direction={'column'}
					spacing={3}
					align={'center'}
					alignSelf={'center'}
					position={'relative'}>
					<Box>
						<VStack spacing={{ base: 4, md: 8, lg: 8 }}>

							<Stack
								spacing={{ base: 4, md: 8, lg: 20 }}
								direction={{ base: 'column', md: 'row' }}
								w={["100%", "30em", "48em"]}
							>
								<Box
									bg={'white'}
									borderRadius="lg"
									p={8}
									color={'gray.700'}
									shadow="base"
									w={"100%"}
								>
									<Box p={3}>
										<Select
											defaultValue={modelOptions[0]}
											chakraStyles={{
												menuList: (provided) => ({
													...provided,
													color: "black",
													bg: "#FFB2B2",
												}),
												menu: (provided) => ({
													...provided,
													zIndex: 9999,
												}),
												option: (provided, state) => ({
													...provided,
													color: "black",
													bg: state.isFocused ? "#ffbaba" : "#FFB2B2",
												}),
												control: (provided, state) => ({
													...provided,
													color: "gray.700",
													borderColor: state.isFocused ? "gray.500" : "gray.300",
													focusBorderColor: "gray.500",
													_focus: {
														borderColor: "gray.500",
														boxShadow: "none",
													},
													_placeholder: { color: 'gray.700' }
												}),
											}}
											options={modelOptions}
											onChange={(event) => {
												if (event !== null) {
													setModel(event.value);
												}
											}}
										/>
									</Box>
									<Chat modelInfo={models.filter((m) => m.name === model)[0] ?? models[0].name} />
									<VStack spacing={5} pt={5}>
										<Link href="https://akashnet.typeform.com/to/rhR4cWxQ">{/*The Mistral-7B-v0.1 Large Language Model (LLM) is a pretrained generative text model with 7 billion parameters.*/}
											<Button variant="solid" borderRadius="lg" bg="#ffbaba" color="#ce4747" _hover={{
												bg: '#ffb2b2',
											}}>Want to run your own custom models?</Button>
										</Link>
									</VStack>
								</Box>
							</Stack>
						</VStack>
					</Box>
				</Stack>
				<Stack direction={'column'}
					spacing={3}
					align={'center'}
					alignSelf={'center'}
					position={'relative'}>
					<Footer />
				</Stack>
			</Container>
		</ChakraProvider >
	)
}