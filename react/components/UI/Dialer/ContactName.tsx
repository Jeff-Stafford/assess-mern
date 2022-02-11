import { useRouter } from 'next/router';
import { useState } from 'react';

interface ContactNameProps {
	id: number;
	name: string;
}

export default function ContactName({ id, name }: ContactNameProps) {
	const [loading, setLoading] = useState(false);
	const router = useRouter();

	const handleClick = async () => {
		setLoading(true);
		await router.push(`/customer-threads/${id}`);
	};

	return (
		<button
			onClick={handleClick}
			className={`${
				loading ? 'opacity-50 ' : ''
			}transition inline-block text-dp-blue-dark transition focus:outline-none text-sm`}
		>
			{loading ? 'Loading...' : name}
		</button>
	);
}
