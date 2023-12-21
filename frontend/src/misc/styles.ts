import { createMultiStyleConfigHelpers, extendTheme } from "@chakra-ui/react"
import { selectAnatomy } from '@chakra-ui/anatomy'


const { definePartsStyle, defineMultiStyleConfig } = createMultiStyleConfigHelpers(selectAnatomy.keys)

const baseStyle = definePartsStyle({
	// define the part you're going to style
	field: {
		fontFamily: `'Satoshi', normal`,
		background: '#ffbaba'
	},
	icon: {
		color: '#FFB2B2',
	},
})

const selectTheme = defineMultiStyleConfig({ baseStyle })

export const themeExtended = extendTheme({
	useSystemColorMode: false,
	fonts: {
		heading: `'Satoshi', normal`,
		body: `'Satoshi', normal`
	},
	components: {
		Select: selectTheme,
		Divider: { baseStyle: { borderColor: 'lightgray' } },
	},
	styles: {
		global: {
			body: {
				bg: '#212529',
				color: '#FFB2B2'
			}
		}
	}
})