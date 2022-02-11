import { ChangeEventHandler, useCallback, useEffect, useState } from 'react';
import Head from 'next/head';

import SubmitButton from '../../components/UI/UserSettings/Input/SubmitButton';
import SettingsLayout from '../../components/Layout/SettingsLayout';
import useNotificationSchedule, { MobileRingChange } from '../../hooks/useNotifcationSchedule';
import LogoBlue from '../../components/Logo/LogoBlue';
import NotificationSchedulerDay from '../../components/UI/NotificationSchedule/NotificationSchedulerDay';
import { useNotifications } from '../../components/UI/Notifications';
import { wait } from '../../utils/helpers/wait';

enum Modes {
	ALWAYS = 1,
	CUSTOM = 2,
}

export enum MobileRingChangeDays {
	SUNDAY = 1,
	MONDAY = 2,
	TUESDAY = 3,
	WEDNESDAY = 4,
	THURSDAY = 5,
	FRIDAY = 6,
	SATURDAY = 7,
}

const NotificationSchedule = () => {
	const [loading, setLoading] = useState(false);
	const [schedule, setSchedule] = useState<MobileRingChange[]>([]);
	const { notify } = useNotifications();
	const [mode, setMode] = useState<Modes>(Modes.ALWAYS);

	const {
		schedule: fetchedSchedule,
		loading: loadingSchedule,
		error,
		setNotificationSchedule,
		mutate,
	} = useNotificationSchedule();

	useEffect(() => {
		if (loadingSchedule || error) return;
		setSchedule(fetchedSchedule);
		if (!fetchedSchedule.length) {
			setMode(Modes.ALWAYS);
		} else {
			setMode(Modes.CUSTOM);
		}
	}, [loadingSchedule, error, fetchedSchedule]);

	const updateCurrentSchedule = (day: number, from: MobileRingChange, to: MobileRingChange) => {
		const newArr = [...schedule];
		const fromIndex = newArr.findIndex(el => el.change_dayofweek === day && el.change_value === 1);
		if (fromIndex !== -1) {
			newArr.splice(fromIndex, 1);
		}
		const toIndex = newArr.findIndex(el => el.change_dayofweek === day && el.change_value === 0);
		if (toIndex !== -1) {
			newArr.splice(toIndex, 1);
		}
		if (from !== null) {
			newArr.push(from);
		}
		if (to !== null) {
			newArr.push(to);
		}
		setSchedule(newArr);
	};

	const getInitialValues = useCallback(
		(day: number) => {
			return {
				from: schedule.find(el => el?.change_dayofweek === day && el?.change_value === 1) || null,
				to: schedule.find(el => el?.change_dayofweek === day && el?.change_value === 0) || null,
			};
		},
		[schedule]
	);

	const submitForm = async () => {
		setLoading(true);
		try {
			if (mode === Modes.ALWAYS) {
				await setNotificationSchedule([]);
			} else {
				await setNotificationSchedule(schedule);
			}
			await wait(1000);
			await mutate();
			notify({
				type: 'success',
				message: 'Your notification schedule has been updated.',
			});
		} catch {
			notify({
				type: 'error',
				message: 'There has been an error trying to update your notification schedule. Please try again.',
			});
		} finally {
			setLoading(false);
		}
	};

	const handleModeChange: ChangeEventHandler<HTMLSelectElement> = e => {
		setMode(+e.target.value);
	};

	return (
		<>
			<Head>
				<title>Notification Schedule</title>
			</Head>
			<SettingsLayout>
				{loadingSchedule && (
					<div className="absolute inset-0 flex items-center bg-white justify-center z-10">
						<div className="animate animate-pulse">
							<LogoBlue />
						</div>
					</div>
				)}
				{error && (
					<div className="absolute inset-0 flex items-center bg-white justify-center z-10">
						<p className="text-center px-10">
							There has been an error loading the notification schedule. Please try again. If the issue persists,
							contact Tone support.
						</p>
					</div>
				)}
				{!loadingSchedule && !error && (
					<div>
						<div>
							<p className="text-xs mb-4">
								Choose when you’ll receive ring notifications for incoming phone calls on the Tone mobile application.
								Outside of those times, ring notifications will not interrupt you.
							</p>
							<h3 className="text-xs font-medium mb-2">Allow notifications:</h3>
							<select
								value={mode}
								onChange={handleModeChange}
								style={{ width: 120, height: 40 }}
								className="px-3 hover:bg-dp-gray-very-light w-full border rounded-lg border-dp-gray appearance-none text-sm"
							>
								<option value="1">Always</option>
								<option value="2">Custom</option>
							</select>
							{mode === Modes.CUSTOM && (
								<div className="mt-4">
									<div className="space-y-3">
										<NotificationSchedulerDay
											initial_values={getInitialValues(2)}
											onChange={(from, to) => updateCurrentSchedule(2, from, to)}
											day={2}
										/>
										<NotificationSchedulerDay
											initial_values={getInitialValues(3)}
											onChange={(from, to) => updateCurrentSchedule(3, from, to)}
											day={3}
										/>
										<NotificationSchedulerDay
											initial_values={getInitialValues(4)}
											onChange={(from, to) => updateCurrentSchedule(4, from, to)}
											day={4}
										/>
										<NotificationSchedulerDay
											initial_values={getInitialValues(5)}
											onChange={(from, to) => updateCurrentSchedule(5, from, to)}
											day={5}
										/>
										<NotificationSchedulerDay
											initial_values={getInitialValues(6)}
											onChange={(from, to) => updateCurrentSchedule(6, from, to)}
											day={6}
										/>
										<NotificationSchedulerDay
											initial_values={getInitialValues(7)}
											onChange={(from, to) => updateCurrentSchedule(7, from, to)}
											day={7}
										/>
										<NotificationSchedulerDay
											initial_values={getInitialValues(1)}
											onChange={(from, to) => updateCurrentSchedule(1, from, to)}
											day={1}
										/>
									</div>
								</div>
							)}

							<div className="mt-6">
								<SubmitButton loading={loading} onClick={submitForm} type="button" />
							</div>
						</div>
					</div>
				)}
			</SettingsLayout>
		</>
	);
};

export default NotificationSchedule;
