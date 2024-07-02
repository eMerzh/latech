import { Button, Switch, Text, Tooltip, rem, useMantineTheme, useMatches } from "@mantine/core";
import { useInterval } from "@mantine/hooks";
import { IconPlayerPauseFilled, IconRefresh, IconReload } from "@tabler/icons-react";
import { useEffect, useState } from "react";

const NavFetcher = ({ fetch }: { fetch: () => void }) => {
	const theme = useMantineTheme();

	const [seconds, setSeconds] = useState(0);
	const refreshData = () => {
		setSeconds(0);
		fetch();
	};
	const { start, stop, active } = useInterval(refreshData, 25000);
	const { start: startSeconds } = useInterval(() => setSeconds((s) => s + 1), 1000);
	useEffect(() => {
		startSeconds();
	}, [startSeconds]);

	const interval = new Date(0);
	interval.setSeconds(seconds);
	return (
		<>
			<Tooltip label="Automatically refresh positions" refProp="rootRef">
				<Switch
					checked={active}
					onChange={(event) => {
						if (event.currentTarget.checked) {
							if (seconds > 25) refreshData();
							start();
						} else {
							stop();
						}
					}}
					color="tecYellow"
					size="md"
					label={
						<>
							auto refresh
							<br />
							<Text c="gray.5" fz="xs">
								since {interval.toISOString().substring(11, 19)}
							</Text>
						</>
					}
					thumbIcon={
						active ? (
							<IconReload style={{ width: rem(12), height: rem(12) }} color={theme.colors.tecYellow[6]} stroke={3} />
						) : (
							<IconPlayerPauseFilled
								style={{ width: rem(12), height: rem(12) }}
								color={theme.colors.gray[6]}
								stroke={3}
							/>
						)
					}
				/>
			</Tooltip>
			<Button
				onClick={refreshData}
				variant="filled"
				rightSection={<IconRefresh size={14} />}
				mr="md"
				color={active ? "gray" : "tecRed"}
			>
				Fetch
			</Button>
		</>
	);
};

export default NavFetcher;
