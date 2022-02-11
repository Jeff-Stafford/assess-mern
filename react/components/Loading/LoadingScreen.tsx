import Logo from '../UI/Navbar/Logo';

export default function LoadingScreen() {
	return (
		<div className="fixed w-full h-screen flex items-center justify-center top-0 left-0 z-50 bg-dp-blue-dark transition duration-750">
			<div className="animate animate-pulse">
				<Logo size="h-10" />
			</div>
		</div>
	);
}
