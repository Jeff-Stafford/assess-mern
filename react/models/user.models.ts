export interface User {
	id: number;
	full_name: string;
	email: string;
	number: {
		number_did: string;
		number_label: string;
	};
	name_first: string;
	name_last: string;
	available: boolean;
	timezone_offset: number;
}
