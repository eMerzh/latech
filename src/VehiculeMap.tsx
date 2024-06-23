import "maplibre-gl/dist/maplibre-gl.css";
import { point } from "@turf/turf";
import { Entity, VehiclePosition } from "gtfs-types";
import { RefObject, useMemo } from "react";
import MapGl, { Source, Layer, Marker, MapRef } from "react-map-gl/maplibre";
import { VehiculeInfoPopup } from "./VehiculeInfo";
import { findNearestFeature } from "./findNearestFeature";
import { RouteItem, routes } from "./routes";
import { Stop } from "./stops";
import { getVehiculeSymbol } from "./vehiculeSymbol";
const mapURL = `https://api.maptiler.com/maps/bright/style.json?key=${import.meta.env.VITE_MAP_KEY}`;

const VehiculeMap = ({
	mapRef,
	vehicles,
	stops,
	selectedVehicle,
	setSelectedVehicleId,
	selectedRoute,
	routeJson,
}: {
	mapRef: RefObject<MapRef>;
	vehicles: Entity[];
	stops: Stop[];
	selectedVehicle: VehiclePosition | null;
	setSelectedVehicleId: (id: string | null, routeId: string | null) => void;
	selectedRoute: RouteItem | null;
	routeJson: GeoJSON.FeatureCollection | null;
}) => {
	const selectedNextStop = useMemo(() => {
		return stops.find((stop) => stop[0] === selectedVehicle?.stop_id);
	}, [stops, selectedVehicle]);

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
				if (entity?.vehicle) setSelectedVehicleId(entity.id, entity.vehicle.trip?.route_id || null);
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
			{selectedVehicle && (
				<VehiculeInfoPopup entity={selectedVehicle} stops={stops} close={() => setSelectedVehicleId(null, null)} />
			)}
		</MapGl>
	);
};

export default VehiculeMap;
