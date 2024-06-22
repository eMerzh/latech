import { useEffect, useMemo, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import { bbox, point } from "@turf/turf";
import { Entity } from "gtfs-types";
import MapGl, { Source, Layer, MapRef, Marker } from "react-map-gl/maplibre";
import navigationIcon from "/navigation.svg";
import { VehiculeInfoPopup } from "./VehiculeInfo";
import { fetchFeed } from "./feed";
import { findNearestFeature } from "./findNearestFeature";
import { RouteItem, fetchRouteFeature, routes } from "./routes";
import { Stop, getStops } from "./stops";
import { getVehiculeSymbol } from "./vehiculeSymbol";

const url = `https://gtfsrt.tectime.be/proto/RealTime/vehicles?key=${import.meta.env.VITE_GTFS_KEY}`;
const mapURL = "https://api.maptiler.com/maps/bright/style.json?key=UVAKtN0Z84SNZiFO1wFP";

function App() {
	const mapRef = useRef<MapRef>(null);
	const [vehicles, setVehicles] = useState<Entity[]>([]);
	const [stops, setStops] = useState<Stop[]>([]);
	const [search, setSearch] = useState<string>("");
	const [route, setRoute] = useState<RouteItem | null>(null);
	const [routeJson, setRouteJson] = useState<GeoJSON.FeatureCollection | null>(null);

	useEffect(() => {
		const fetchStops = async () => {
			const result = await getStops();
			setStops(result || []);
		};
		fetchStops();
	}, []);

	useEffect(() => {
		const fetchRoute = async (id: string) => {
			const result = await fetchRouteFeature(id);
			setRouteJson(result || []);
		};
		if (route?.route_code_names[0]) fetchRoute(route.route_code_names[0]);
	}, [route]);

	const [popupEntityId, setPopupEntityId] = useState<string | null>(null);

	const popupEntity = useMemo(() => vehicles.find((v) => v.id === popupEntityId)?.vehicle, [vehicles, popupEntityId]);
	const selectedNextStop = useMemo(() => {
		return stops.find((stop) => stop[0] === popupEntity?.stop_id);
	}, [stops, popupEntity]);

	const onClick = async () => {
		const result = await fetchFeed(url);
		setVehicles(result || []);
	};

	const selectRoute = async (route: RouteItem) => {
		setRoute(route);
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

	return (
		<>
			<div className="card">
				<button type="button" onClick={onClick}>
					Fetch <img src={navigationIcon} alt="navigation" />
				</button>
			</div>
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
					{route && routeJson && (
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
									route?.route_id || "",
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
								"circle-color": ["match", ["get", "route_id"], route?.route_id || "", "#f00", "gray"],
							}}
						/>
					</Source>
					{selectedNextStop && <Marker latitude={selectedNextStop[2]} longitude={selectedNextStop[3]} />}
					{popupEntity && <VehiculeInfoPopup entity={popupEntity} stops={stops} close={() => setPopupEntityId(null)} />}
				</MapGl>
				<div
					style={{
						flex: 1,
						textAlign: "left",
						marginLeft: "1rem",
						overflowY: "auto",
					}}
				>
					<input type="text" placeholder="Search ..." value={search} onChange={(e) => setSearch(e.target.value)} />
					<button type="button" onClick={() => setRoute(null)}>
						Clear
					</button>
					<ul>
						{Object.values(routes)
							.filter((route) => route.route_code_names.length > 0)
							.filter((route) => `${route.route_short_name} ${route.route_long_name}`.match(new RegExp(search, "i")))
							.map((route) => (
								<li
									key={route.route_id}
									onClick={() => selectRoute(route)}
									onKeyUp={(e) => e.key === "Enter" && selectRoute(route)}
								>
									<span style={{ backgroundColor: "red", padding: "2px", border: "1px solid white" }}>
										{route.route_short_name}
									</span>{" "}
									{route.route_long_name}
								</li>
							))}
					</ul>
				</div>
			</div>
		</>
	);
}

export default App;
