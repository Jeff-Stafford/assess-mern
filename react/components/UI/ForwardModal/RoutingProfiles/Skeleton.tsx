const Skeleton = () => (
	<div className="bg-white w-full h-16 px-3 py-2 flex items-center space-x-2">
		<div className="h-11 w-11 bg-dp-gray-light animate-pulse"></div>
		<div className="space-y-2 flex-1">
			<div className="h-4 w-1/2 bg-dp-gray-light animate-pulse"></div>
			<div className="h-4 w-1/3 bg-dp-gray-light animate-pulse"></div>
		</div>
	</div>
);

export default Skeleton;
