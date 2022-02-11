interface CallButtonProps {
	available?: boolean;
	onClick: () => void;
}

export default function CallButton({ available, onClick }: CallButtonProps) {
	const handleClick = () => {
		if (!available) return;

		onClick();
	};

	return (
		<button
			onClick={handleClick}
			className={`${
				available
					? 'text-dp-blue-dark bg-dp-gray bg-opacity-0 hover:bg-opacity-25 cursor-pointer'
					: 'text-dp-gray cursor-not-allowed'
			} h-11 w-11 flex items-center justify-center focus:outline-none rounded-md transition`}
			title="Make a Call"
		>
			<svg className="h-5" viewBox="0 0 21.105 21.104">
				<g transform="translate(0 1.104)">
					<path
						d="M12.388 3.823A4.783 4.783 0 0116.17 7.6M12.388 0A8.609 8.609 0 0120 7.588"
						fill="none"
						stroke="currentColor"
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth="2"
					/>
					<path
						d="M19.423 15.66a16.8 16.8 0 00-3.512-2.348c-1.052-.505-1.437-.495-2.182.042-.62.448-1.02.864-1.734.708a10.343 10.343 0 01-3.484-2.578 10.269 10.269 0 01-2.572-3.487c-.151-.719.266-1.114.708-1.734.536-.745.552-1.13.042-2.182A16.468 16.468 0 004.34.576c-.765-.765-.937-.6-1.359-.448a7.733 7.733 0 00-1.244.661A3.754 3.754 0 00.243 2.367c-.3.64-.64 1.833 1.109 4.947a27.6 27.6 0 004.852 6.472l.005.005.005.005a27.707 27.707 0 006.472 4.853c3.113 1.75 4.306 1.406 4.946 1.109a3.69 3.69 0 001.579-1.495 7.733 7.733 0 00.661-1.244c.15-.422.322-.594-.449-1.359z"
						fill="currentColor"
					/>
				</g>
			</svg>
		</button>
	);
}
