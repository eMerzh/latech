import { Button, Switch, Tooltip, rem, useMantineTheme, useMatches } from "@mantine/core";
import { useInterval } from "@mantine/hooks";
import { IconPlayerPauseFilled, IconRefresh, IconReload } from "@tabler/icons-react";

const NavFetcher = ({ fetch }: { fetch: () => void }) => {
	const theme = useMantineTheme();

	const { start, stop, active } = useInterval(fetch, 25000);
	const refreshLabel = useMatches({
		base: "",
		sm: "auto refresh",
	});
	return (
		<>
			<Tooltip label="Automatically refresh positions" refProp="rootRef">
				<Switch
					checked={active}
					onChange={(event) => (event.currentTarget.checked ? start() : stop())}
					color="tecYellow"
					size="md"
					label={refreshLabel}
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
				onClick={fetch}
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
