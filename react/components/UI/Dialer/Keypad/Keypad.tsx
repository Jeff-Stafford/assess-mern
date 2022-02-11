import KeypadNumber from './KeypadNumber';

interface KeypadProps {
	onClick: (digit: string) => void;
}

export default function Keypad(props: KeypadProps) {
	return (
		<div className="w-60 mx-auto">
			<div className="grid grid-cols-3 gap-6 place-items-center place-content-center">
				<KeypadNumber onClick={() => props.onClick('1')} digit="1" />
				<KeypadNumber onClick={() => props.onClick('2')} digit="2" label="ABC" />
				<KeypadNumber onClick={() => props.onClick('3')} digit="3" label="DEF" />
				<KeypadNumber onClick={() => props.onClick('4')} digit="4" label="GHI" />
				<KeypadNumber onClick={() => props.onClick('5')} digit="5" label="JKL" />
				<KeypadNumber onClick={() => props.onClick('6')} digit="6" label="MNO" />
				<KeypadNumber onClick={() => props.onClick('7')} digit="7" label="PQRS" />
				<KeypadNumber onClick={() => props.onClick('8')} digit="8" label="TUV" />
				<KeypadNumber onClick={() => props.onClick('9')} digit="9" label="WXYZ" />
				<KeypadNumber onClick={() => props.onClick('')} digit="*" />
				<KeypadNumber onClick={() => props.onClick('0')} digit="0" label="+" />
				<KeypadNumber onClick={() => props.onClick('#')} digit="#" />
			</div>
		</div>
	);
}
