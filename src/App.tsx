import { useMemo, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import {
	AppShell,
	Badge,
	Box,
	Burger,
	Card,
	CloseButton,
	Group,
	Text,
	Title,
	getGradient,
	useMantineTheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { bbox } from "@turf/turf";
import { Entity } from "gtfs-types";
import { MapRef } from "react-map-gl/maplibre";
import NavFetcher from "./NavFetcher";
import RouteDetails from "./RouteDetails";
import RoutesList from "./RoutesList";
import VehiculeMap from "./VehiculeMap";
import { fetchFeed } from "./feed";
import { useFetchSingleRoute, useFetchStops } from "./fetchHooks";
import { RouteItem, fetchRouteFeature, routes } from "./routes";

type Maybe<T> = T | null | undefined;
type Truthy<T> = T extends Maybe<false | "" | 0> ? never : T;

export function truthy<T>(value: T): value is Truthy<T> {
	return Boolean(value);
}

const url = `https://gtfsrt.tectime.be/proto/RealTime/vehicles?key=${import.meta.env.VITE_GTFS_KEY}`;

function App() {
	const mapRef = useRef<MapRef>(null);
	const [vehicles, setVehicles] = useState<Entity[]>([]);
	const [selectedRoute, setSelectedRoute] = useState<RouteItem | null>(null);
	const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
	const [sidebarOpened, { toggle: toggleSb }] = useDisclosure();
	const stops = useFetchStops();
	const routeJson = useFetchSingleRoute(selectedRoute?.route_code_names[0] || null);
	const selectedVehicle = useMemo(
		() => vehicles.find((v) => v.id === selectedVehicleId)?.vehicle || null,
		[vehicles, selectedVehicleId],
	);

	const fetchPositions = async () => {
		const result = await fetchFeed(url);
		setVehicles(result || []);

		// If a vehicle is selected, center the map on it
		if (selectedVehicleId) {
			const vehicle = (result || []).find((v) => v.id === selectedVehicleId);
			if (vehicle?.vehicle) {
				const x = vehicle.vehicle.position?.longitude;
				const y = vehicle.vehicle.position?.latitude;
				if (x && y) {
					mapRef.current?.flyTo({ center: [x, y] });
				}
			}
		}
	};

	const selectRoute = async (route: RouteItem | null) => {
		if (!route) {
			setSelectedRoute(route);
			return;
		}
		const result = await fetchRouteFeature(route.route_code_names[0]);
		setSelectedRoute(route);
		const [x1, y1, x2, y2] = bbox(result);
		mapRef.current?.fitBounds([x1, y1, x2, y2], { padding: 20 });
	};

	const theme = useMantineTheme();

	return (
		<AppShell
			header={{ height: 60 }}
			navbar={{ width: 300, breakpoint: "sm", collapsed: { mobile: !sidebarOpened } }}
			padding="md"
		>
			<AppShell.Header>
				<Group justify="space-between" h="100%">
					<Group px="md">
						<Burger opened={sidebarOpened} onClick={toggleSb} hiddenFrom="sm" size="sm" />
						<Title
							order={1}
							style={{
								backgroundImage: getGradient({ deg: 180, from: "tecYellow.5", to: "tecRed.5" }, theme),
								WebkitBackgroundClip: "text",
								WebkitTextFillColor: "transparent",
								BackgroundClip: "text",
							}}
						>
							LaTech
						</Title>
					</Group>
					<Group>
						<NavFetcher fetch={fetchPositions} />
					</Group>
				</Group>
			</AppShell.Header>
			<AppShell.Navbar p="md">
				{selectedRoute && (
					<Box>
						<Card shadow="xs" padding="sm" radius="md" withBorder bg="tecYellow">
							<Group justify="space-between">
								<div>
									<Badge>{selectedRoute.route_short_name}</Badge>
								</div>
								<CloseButton onClick={() => setSelectedRoute(null)} />
							</Group>
							<Text fw={500}>{selectedRoute.route_long_name}</Text>
						</Card>
					</Box>
				)}
				<RoutesList routes={Object.values(routes)} selectRoute={selectRoute} selectedRoute={selectedRoute} />
			</AppShell.Navbar>
			<AppShell.Main>
				<div
					style={{
						display: "flex",
						flexDirection: "row",
						marginBottom: "1rem",
					}}
				>
					<VehiculeMap
						mapRef={mapRef}
						routeJson={routeJson}
						selectedRoute={selectedRoute}
						selectedVehicle={selectedVehicle}
						stops={stops}
						setSelectedVehicleId={(id, routeId) => {
							setSelectedVehicleId(id);
							if (routeId) selectRoute(routes[routeId || ""] || null);
						}}
						vehicles={vehicles}
					/>
					{routeJson && (
						<RouteDetails
							routeJson={routeJson}
							vehicules={vehicles
								.filter((v) => v.vehicle?.trip?.route_id === selectedRoute?.route_id)
								.map((v) => v.vehicle)
								.filter(truthy)}
						/>
					)}
				</div>
			</AppShell.Main>
		</AppShell>
	);
}

export default App;
