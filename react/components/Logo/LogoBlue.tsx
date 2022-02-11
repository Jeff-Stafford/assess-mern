interface LogoBlueProps {
	size?: string;
}

const LogoBlue = ({ size = 'h-10' }: LogoBlueProps) => (
	<svg className={`${size} mx-auto`} viewBox="0 0 122.04 40">
		<path
			d="M23.551 23.665a17.785 17.785 0 011.183-6.6 14.938 14.938 0 013.332-5.138 15.475 15.475 0 015.076-3.363 17.876 17.876 0 0112.953 0 14.882 14.882 0 018.345 8.5 18.918 18.918 0 010 13.171 14.816 14.816 0 01-8.345 8.532 17.879 17.879 0 01-12.953 0 15.475 15.475 0 01-5.075-3.363 14.87 14.87 0 01-3.332-5.169 17.851 17.851 0 01-1.183-6.57zm8.158 0a12.429 12.429 0 00.592 3.954 9.311 9.311 0 001.619 3.02 7.4 7.4 0 002.491 1.962 7.19 7.19 0 003.207.716 7 7 0 003.176-.716 7.5 7.5 0 002.46-1.962 9.338 9.338 0 001.619-3.02 13.41 13.41 0 000-7.878 9.3 9.3 0 00-1.619-3.051 7.524 7.524 0 00-2.46-1.962 7.015 7.015 0 00-3.176-.716 7.2 7.2 0 00-3.207.716 7.424 7.424 0 00-2.491 1.962 9.275 9.275 0 00-1.619 3.051 12.517 12.517 0 00-.592 3.923z"
			fill="#375dd0"
		/>
		<path
			d="M60.245 8.096h7.971v2.678a14.372 14.372 0 019.092-3.425 11.9 11.9 0 014.453.81 10.234 10.234 0 015.823 5.854 12.322 12.322 0 01.809 4.546v20.674h-8.038V19.992a5.647 5.647 0 00-1.525-4.079 5.238 5.238 0 00-3.954-1.589h-.221a6.7 6.7 0 00-6.442 6.731v18.178h-7.968z"
			fill="#375dd0"
		/>
		<path
			d="M92.957 23.416a17.533 17.533 0 011.152-6.477 15.424 15.424 0 013.207-5.075 14.384 14.384 0 014.857-3.332 15.7 15.7 0 016.165-1.183 13.262 13.262 0 015.573 1.152 12.756 12.756 0 014.328 3.207 14.664 14.664 0 012.8 4.92 19.052 19.052 0 011 6.289v1.4a10.107 10.107 0 01-.125 1.525h-21.11a8.453 8.453 0 002.958 5.76 9.66 9.66 0 006.508 2.211 14.789 14.789 0 004.515-.747 23.5 23.5 0 004.764-2.18v6.663a25.489 25.489 0 01-10.586 2.429 16.743 16.743 0 01-6.477-1.214 14.674 14.674 0 01-5.044-3.425 15.773 15.773 0 01-3.3-5.231 18.2 18.2 0 01-1.184-6.694zm21.422-2.74a8.343 8.343 0 00-1.93-5.169 5.622 5.622 0 00-4.421-1.993 6.737 6.737 0 00-4.92 1.962 8.12 8.12 0 00-2.3 5.2z"
			fill="#375dd0"
		/>
		<g fill="#375dd0">
			<path d="M21.924 31.883v6.773a18.431 18.431 0 01-6.711 1.343 11.68 11.68 0 01-4.314-.767 9.767 9.767 0 01-5.559-5.4 10.445 10.445 0 01-.8-4.122V19.241h8.179v9.384a4.413 4.413 0 001.277 3.258 4.583 4.583 0 003.387 1.279 10.377 10.377 0 004.541-1.279z" />
			<path d="M11.551 16.642A24.535 24.535 0 010 19.241v-7.349a19.3 19.3 0 004.542-.469V2.807L12.722 0v8.306a25.537 25.537 0 017.349-.956v7.35a17.56 17.56 0 00-8.52 1.942z" />
		</g>
	</svg>
);

export default LogoBlue;
