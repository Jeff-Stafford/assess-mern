import Head from 'next/head';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import Navbar from '../components/UI/Navbar';
import PageWrap from '../components/UI/Layouts/PageWrap';
import LeftSidebar from '../components/Home/LeftSidebar';
import RightSidebar from '../components/Home/RightSidebar';
import NoCustomers from '../components/UI/CustomerThread/NoCustomers';
import LoadingCustomerThread from '../components/UI/CustomerThread/LoadingCustomerThread';
import { useCustomerThreads } from '../hooks/useCustomerThreads';

export default function Home() {
	const router = useRouter();
	const user = useSelector(({ user }) => user);
	const { loading, error, customerThreads } = useCustomerThreads(user.id);

	useEffect(() => {
		if (!loading && !error) {
			if (customerThreads.length) {
				router.push(`/customer-threads/${customerThreads[0].customer_id}`);
			}
		}
	}, [customerThreads, loading, error, router]);

	return (
		<>
			<Head>
				<title>Home</title>
			</Head>
			<PageWrap>
				<Navbar />
				<div className="flex-1 flex main-content-height">
					<LeftSidebar />
					{!loading && !error && customerThreads.length > 0 && <div className="flex-1"></div>}
					{loading && (
						<div className="flex-1 relative h-full">
							<LoadingCustomerThread />
						</div>
					)}
					{!loading && !error && !customerThreads.length && <NoCustomers />}
					<RightSidebar />
				</div>
			</PageWrap>
		</>
	);
}
