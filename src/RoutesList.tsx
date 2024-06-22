import { Badge, CloseButton, Input, List, ScrollArea } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { RouteItem } from "./routes";

const RoutesList = ({
	routes,
	selectRoute,
	selectedRoute,
}: { routes: RouteItem[]; selectRoute: (route: RouteItem | null) => void; selectedRoute: RouteItem | null }) => {
	const [search, setSearch] = useState<string>("");
	const sortedRoute = useMemo(() => {
		return routes.sort((a, b) => {
			// natural sort
			return a.route_short_name.localeCompare(b.route_short_name, undefined, { numeric: true, sensitivity: "base" });
		});
	}, [routes]);

	return (
		<>
			<Input
				placeholder="Search route..."
				value={search}
				onChange={(event) => setSearch(event.currentTarget.value)}
				rightSectionPointerEvents="all"
				mt="md"
				leftSection={<IconSearch size={16} />}
				rightSection={
					<CloseButton
						aria-label="Clear search"
						onClick={() => setSearch("")}
						style={{ display: search ? undefined : "none" }}
					/>
				}
			/>
			<ScrollArea pt="md">
				<List listStyleType="none">
					{sortedRoute
						.filter((route) => route.route_code_names.length > 0)
						.filter((route) => `${route.route_short_name} ${route.route_long_name}`.match(new RegExp(search, "i")))
						.map((route) => (
							<List.Item
								key={route.route_id}
								onClick={() => selectRoute(route)}
								onKeyUp={(e) => e.key === "Enter" && selectRoute(route)}
							>
								<Badge variant={route.route_id === selectedRoute?.route_id ? "filled" : "outline"}>
									{route.route_short_name}
								</Badge>{" "}
								{route.route_long_name}
							</List.Item>
						))}
				</List>
			</ScrollArea>
		</>
	);
};

export default RoutesList;
