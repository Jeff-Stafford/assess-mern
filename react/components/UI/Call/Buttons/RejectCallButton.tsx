interface RejectCallButtonProps {
	onClick: () => void;
}

export default function RejectCallButton({ onClick }: RejectCallButtonProps) {
	return (
		<button
			onClick={() => onClick()}
			className="flex items-center justify-center flex-1 h-10 transition rounded-bl-lg bg-dp-red hover:bg-opacity-75 focus:outline-none"
		>
			<svg className="h-8" viewBox="0 0 38.196 38.196">
				<path
					d="M4.69469492 22.69051666a22.686 22.686 0 005.59321464-1.10874343c1.48633845-.5218448 1.8448416-.90014693 2.0435386-2.12273456.1675843-1.01611244.14919953-1.79958676.97934289-2.33133106s3.18693026-.86054895 5.78413347-.86267027 4.96247539.32809755 5.78413347.86267027.80680884 1.31451151.9793429 2.33133106c.198697 1.22258763.55225039 1.6058395 2.04353859 2.12273456a22.238 22.238 0 005.6002857 1.10874343c1.46229683 0 1.46724658-.3231478 1.72534055-.86974134a10.443 10.443 0 00.55649304-1.81938575 5.069 5.069 0 00-.08131728-2.93661446c-.32880465-.89449008-1.13844192-2.36173665-5.78413347-3.66281313a37.272 37.272 0 00-10.813784-1.54644253h-.019799a37.418 37.418 0 00-10.813784 1.54644253c-4.6400347 1.29966227-5.45532882 2.76832305-5.78413347 3.66281313a4.983 4.983 0 00-.07919596 2.93307893 10.443 10.443 0 00.55649304 1.81938575c.26445793.55012907.26445793.87822662 1.7302903.87327687z"
					fill="#fff"
				/>
			</svg>
		</button>
	);
}
