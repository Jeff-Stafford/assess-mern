import { createPortal } from 'react-dom';
import { ReactNode } from 'react';
import usePortal from '../../hooks/usePortal';

interface PortalProps {
	children: ReactNode;
}

export default function Portal({ children }: PortalProps) {
	const target = usePortal();
	return createPortal(children, target);
}
