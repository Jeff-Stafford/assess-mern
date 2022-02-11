interface CallForwardedProps {
	to: string;
	time: string;
}

export default function CallForwared(props: CallForwardedProps) {
	return (
		<div className="flex items-center justify-center flex-shrink-0">
			<svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" viewBox="0 0 18 18">
				<path
					d="M18,10.5,22.5,6,18,1.5V4.2H14.4V7.8H18Zm1.8,4.05a10.224,10.224,0,0,1-3.213-.513.919.919,0,0,0-.918.216l-1.98,1.98A13.541,13.541,0,0,1,7.758,10.3l1.98-1.989a.864.864,0,0,0,.225-.9A10.224,10.224,0,0,1,9.45,4.2a.9.9,0,0,0-.9-.9H5.4a.9.9,0,0,0-.9.9A15.3,15.3,0,0,0,19.8,19.5a.9.9,0,0,0,.9-.9V15.45A.9.9,0,0,0,19.8,14.55Z"
					transform="translate(-4.5 -1.5)"
					fill="#959dac"
				/>
			</svg>
			<span className="block font-medium text-dp-gray-dark ml-2 select-none">
				Call forwarded to {props.to} ({props.time})
			</span>
		</div>
	);
}
