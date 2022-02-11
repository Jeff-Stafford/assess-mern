interface FirstStepProps {
	error?: string;
	loading?: boolean;
}

const FirstStep = ({ error = '', loading }: FirstStepProps) => (
	<div className="text-center text-sm">
		{loading && !error && <p>The system is attempting to log you in...</p>}
		{!loading && !error && <p>Success! Logging you in...</p>}
		{!loading && error && <p>{error}</p>}
	</div>
);

export default FirstStep;
