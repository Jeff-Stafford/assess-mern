interface MessageBlockProps {
	position: string;
	avatar?: string;
	initials?: string;
	children?: any;
}

export default function MessageBlock(props: MessageBlockProps) {
	return (
		<div className={`${props.position === 'left' ? 'justify-start' : 'justify-end'} w-full flex flex-shrink-0`}>
			<div className={`flex-row-reverse flex flex-shrink-0`}>
				<div className={`${props.position === 'left' ? 'mr-3' : 'ml-3'} flex-shrink-0`}>
					{props.avatar && props.avatar.length && props.position === 'right' && (
						<img src={props.avatar} alt="Sender image" className="w-9 h-9 rounded-full" />
					)}
					{!props.avatar && (
						<div className="h-9 w-9 bg-dp-gray-dark text-white rounded-full flex items-center justify-center select-none">
							<span className="text-sm">{props.initials}</span>
						</div>
					)}
				</div>
				<div className={`${props.position === 'left' ? 'items-start' : 'items-end'} flex flex-col space-y-2 flex-1`}>
					{props.children}
				</div>
			</div>
		</div>
	);
}
