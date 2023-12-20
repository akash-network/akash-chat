import { Icon, IconProps } from "@chakra-ui/react";

export const AkashLogoRed = (props: IconProps) => {
	return (
		<Icon
			width={"100%"}
			height={'100%'}
			viewBox="0 0 24 21"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			{...props}>
			<path d="M16.044 13.9374L20.0055 20.9051H12.0033L8 13.9374H16.044Z" fill="url(#paint0_linear_65_516)" />
			<path d="M20.0034 20.9062L24.0001 13.9386L16.0001 0H8L20.0034 20.9062Z" fill="#FF414C" />
			<path d="M4 6.96582H12.0001L4.00333 20.9045L0 13.9368L4 6.96582Z" fill="#FF414C" />
			<defs>
				<linearGradient id="paint0_linear_65_516" x1="12.5463" y1="16.0632" x2="17.0916" y2="12.548" gradientUnits="userSpaceOnUse">
					<stop stop-color="#FF414C" />
					<stop offset="1" stop-color="#FF414C" stop-opacity="0" />
				</linearGradient>
			</defs>
		</Icon>
	);
}
