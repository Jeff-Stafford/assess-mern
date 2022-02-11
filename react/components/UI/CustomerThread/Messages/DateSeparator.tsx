import { getDateSeparatorFormat } from '../../../../utils/helpers/customer-thread';

interface DateSeparatorProps {
	title: string;
}

export default function DateSeparator({ title }: DateSeparatorProps) {
	return (
		<div className="text-center my-4">
			<span className="text-xs font-medium text-dp-gray-very-dark">{getDateSeparatorFormat(title)}</span>
		</div>
	);
}
