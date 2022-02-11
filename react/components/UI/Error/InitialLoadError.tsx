const InitialLoadError = () => (
	<div className="fixed w-full h-screen flex items-center justify-center top-0 left-0 z-50 bg-dp-blue-dark transition duration-750">
		<div className="mx-auto text-white text-lg text-center" style={{ width: 500 }}>
			<p>
				There has been an error opening Tone.
				<br />
				Please check your Internet connection. If the problem persists, please contact{' '}
				<a href="mailto:support@tone.com" className="font-medium hover:underline">
					support@tone.com
				</a>
			</p>
		</div>
	</div>
);

export default InitialLoadError;
