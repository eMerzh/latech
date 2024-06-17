import { useEffect, useMemo, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import "./App.css";

import { distance, point } from "@turf/turf";
import { Entity } from "gtfs-types";
import { Marker } from "react-map-gl";
import MapGl, { Source, Layer, MapGeoJSONFeature, LngLat } from "react-map-gl/maplibre";
import navigationIcon from "/navigation.svg";
import { VehiculeInfoPopup } from "./VehiculeInfo";
import { fetchFeed } from "./feed";
import { routes } from "./routes";
import { Stop, getStops } from "./stops";
import { getVehiculeSymbol } from "./vehiculeSymbol";

const url = `https://gtfsrt.tectime.be/proto/RealTime/vehicles?key=${import.meta.env.VITE_GTFS_KEY}`;
const mapURL = "https://api.maptiler.com/maps/bright/style.json?key=UVAKtN0Z84SNZiFO1wFP";

function findNearest(features: MapGeoJSONFeature[], clickPosition: LngLat) {
	if (features.length < 0) return null;
	const clickPoint = point([clickPosition.lng, clickPosition.lat]);
	const sorted = features.sort((a, b) => {
		if (a.geometry.type !== "Point" || b.geometry.type !== "Point") return 0;
		const ptA = point([a.geometry.coordinates[0], a.geometry.coordinates[1]]);
		const ptB = point([b.geometry.coordinates[0], b.geometry.coordinates[1]]);
		return distance(ptA, clickPoint) - distance(ptB, clickPoint);
	});
	return sorted[0];
}

function App() {
	const [vehicles, setVehicles] = useState<Entity[]>([]);
	const [stops, setStops] = useState<Stop[]>([]);
	const [search, setSearch] = useState<string>("");
	const [highlightedRoute, setHighlightedRoute] = useState<string | null>(null);
	useEffect(() => {
		const feetchStops = async () => {
			const result = await getStops();
			setStops(result || []);
		};
		feetchStops();
	}, []);

	const [popupEntityId, setPopupEntityId] = useState<string | null>(null);

	const popupEntity = useMemo(() => vehicles.find((v) => v.id === popupEntityId)?.vehicle, [vehicles, popupEntityId]);
	const selectedNextStop = useMemo(() => {
		return stops.find((stop) => stop[0] === popupEntity?.stop_id);
	}, [stops, popupEntity]);

	const onClick = async () => {
		const result = await fetchFeed(url);
		setVehicles(result || []);
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
					mapStyle={mapURL}
					interactiveLayerIds={["vehicles-layer"]}
					onClick={(e) => {
						const feature = findNearest(e.features || [], e.lngLat);
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
					<Source id="vehicles" type="geojson" data={vehiclesGeoJSON}>
						<Layer
							id="vehicles-layer"
							type="symbol"
							minzoom={10}
							layout={{
								"icon-image": [
									"match",
									["get", "route_id"],
									highlightedRoute || "",
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
								"circle-color": ["match", ["get", "route_id"], highlightedRoute || "", "#f00", "gray"],
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
					<button type="button" onClick={() => setHighlightedRoute(null)}>
						Clear
					</button>
					<ul>
						{Object.values(routes)
							.filter((route) => `${route.route_short_name} ${route.route_long_name}`.match(new RegExp(search, "i")))
							.map((route) => (
								<li
									key={route.route_id}
									onClick={() => setHighlightedRoute(route.route_id)}
									onKeyUp={(e) => e.key === "Enter" && setHighlightedRoute(route.route_id)}
								>
									<span>{route.route_short_name}</span> {route.route_long_name}
								</li>
							))}
					</ul>
				</div>
			</div>

			<div className="card">
				<button type="button" onClick={onClick}>
					Fetch <img src={navigationIcon} alt="navigation" />
				</button>
			</div>
		</>
	);
}

export default App;
