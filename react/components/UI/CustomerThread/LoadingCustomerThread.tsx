import CustomerDataSkeleton from '../Skeleton/CustomerDataSkeleton';

export default function LoadingCustomerThread() {
	return (
		<>
			<CustomerDataSkeleton />
			<div className="flex-1"></div>
		</>
	);
}
