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
import { bbox, point } from "@turf/turf";
import { Entity } from "gtfs-types";
import MapGl, { Source, Layer, MapRef, Marker } from "react-map-gl/maplibre";
import NavFetcher from "./NavFetcher";
import RoutesList from "./RoutesList";
import { VehiculeInfoPopup } from "./VehiculeInfo";
import { fetchFeed } from "./feed";
import { useFetchSingleRoute, useFetchStops } from "./fetchHooks";
import { findNearestFeature } from "./findNearestFeature";
import { RouteItem, fetchRouteFeature, routes } from "./routes";
import { getVehiculeSymbol } from "./vehiculeSymbol";

const url = `https://gtfsrt.tectime.be/proto/RealTime/vehicles?key=${import.meta.env.VITE_GTFS_KEY}`;
const mapURL = `https://api.maptiler.com/maps/bright/style.json?key=${import.meta.env.VITE_MAP_KEY}`;

function App() {
	const mapRef = useRef<MapRef>(null);
	const [vehicles, setVehicles] = useState<Entity[]>([]);
	const [selectedRoute, setSelectedRoute] = useState<RouteItem | null>(null);
	const [popupEntityId, setPopupEntityId] = useState<string | null>(null);
	const [sidebarOpened, { toggle: toggleSb }] = useDisclosure();
	const stops = useFetchStops();
	const routeJson = useFetchSingleRoute(selectedRoute?.route_code_names[0] || null);
	const popupEntity = useMemo(() => vehicles.find((v) => v.id === popupEntityId)?.vehicle, [vehicles, popupEntityId]);
	const selectedNextStop = useMemo(() => {
		return stops.find((stop) => stop[0] === popupEntity?.stop_id);
	}, [stops, popupEntity]);

	const fetchPositions = async () => {
		const result = await fetchFeed(url);
		setVehicles(result || []);
	};

	const selectRoute = async (route: RouteItem | null) => {
		setSelectedRoute(route);
		if (!route) return;
		const result = await fetchRouteFeature(route.route_code_names[0]);
		const [x1, y1, x2, y2] = bbox(result);
		mapRef.current?.fitBounds([x1, y1, x2, y2], { padding: 20 });
	};

	const vehiclesGeoJSON = useMemo(() => {
		return {
			type: "FeatureCollection",
			features: vehicles
				.map((vehicle) =>
					point([vehicle.vehicle?.position?.longitude || 0, vehicle.vehicle?.position?.latitude || 0], {
						vehicle_id: vehicle.id,
						route_id: vehicle.vehicle?.trip?.route_id || "",
						route_short_name: routes[vehicle.vehicle?.trip?.route_id || ""]?.route_short_name || "--",
						bearing: Number.parseInt(vehicle.vehicle?.position?.bearing || "0", 10),
					}),
				)
				.concat(
					// add debug point
					import.meta.env.PROD
						? []
						: [
								point([4.406, 50.6559], {
									vehicle_id: "1",
									route_id: "1",
									route_short_name: "1",
									bearing: 0,
								}),
							],
				),
		};
	}, [vehicles]);
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
					<MapGl
						initialViewState={{
							longitude: 4.406,
							latitude: 50.6559,
							zoom: 12,
						}}
						style={{ width: 900, height: 700 }}
						ref={mapRef}
						mapStyle={mapURL}
						interactiveLayerIds={["vehicles-layer"]}
						onClick={(e) => {
							const feature = findNearestFeature(e.features || [], e.lngLat);
							if (!feature) return;

							const entity = vehicles.find((v) => v.id === feature.properties?.vehicle_id);
							if (entity?.vehicle) setPopupEntityId(entity.id);
						}}
						onLoad={async (e) => {
							const map = e.target;
							map.addImage("vehicle-icon-selected", getVehiculeSymbol(100, map, true), { pixelRatio: 2 });
							map.addImage("vehicle-icon-regular", getVehiculeSymbol(100, map, false), { pixelRatio: 2 });
						}}
					>
						{selectedRoute && routeJson && (
							<Source id="route" type="geojson" data={routeJson}>
								<Layer id="route-layer" type="line" paint={{ "line-color": "#f00", "line-width": 2 }} />
								<Layer
									id="stops-layer"
									type="circle"
									paint={{ "circle-color": "#ef7676", "circle-stroke-color": "white", "circle-stroke-width": 1 }}
									filter={["==", "$type", "Point"]}
								/>
							</Source>
						)}
						<Source id="vehicles" type="geojson" data={vehiclesGeoJSON}>
							<Layer
								id="vehicles-layer"
								type="symbol"
								minzoom={10}
								layout={{
									"icon-image": [
										"match",
										["get", "route_id"],
										selectedRoute?.route_id || "",
										"vehicle-icon-selected",
										"vehicle-icon-regular",
									],
									"icon-size": 1.6,
									"text-field": ["get", "route_short_name"],
									"icon-rotate": ["get", "bearing"],
									"text-size": 12,
									// to display all vehicles
									"icon-allow-overlap": true,
									"text-allow-overlap": true,
								}}
								paint={{
									"text-color": "white",
								}}
							/>
							<Layer
								id="vehicles-layer-dot"
								type="circle"
								maxzoom={10}
								paint={{
									"circle-radius": 3,
									"circle-color": ["match", ["get", "route_id"], selectedRoute?.route_id || "", "#f00", "gray"],
								}}
							/>
						</Source>
						{selectedNextStop && <Marker latitude={selectedNextStop[2]} longitude={selectedNextStop[3]} />}
						{popupEntity && (
							<VehiculeInfoPopup entity={popupEntity} stops={stops} close={() => setPopupEntityId(null)} />
						)}
					</MapGl>
				</div>
			</AppShell.Main>
		</AppShell>
	);
}

export default App;
