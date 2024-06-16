import { useMemo, useState } from "react";
import "./App.css";

import MapGl, { Source, Layer, Popup } from "react-map-gl/maplibre";
import navigationIcon from "/navigation.svg";
import "maplibre-gl/dist/maplibre-gl.css";
import { point } from "@turf/turf";
import { Entity, VehiclePosition } from "gtfs-types";
import { fetchFeed } from "./feed";

const url = `https://gtfsrt.tectime.be/proto/RealTime/vehicles?key=${import.meta.env.VITE_GTFS_KEY}`;
const mapURL = "https://api.maptiler.com/maps/bright/style.json?key=UVAKtN0Z84SNZiFO1wFP";

function App() {
	const [vehicles, setVehicles] = useState<Entity[]>([]);
	const [popupEntity, setPopupEntity] = useState<VehiclePosition | null>(null);

	const onClick = async () => {
		const result = await fetchFeed(url);
		setVehicles(result || []);
	};

	const vehiclesGeoJSON = useMemo(() => {
		return {
			type: "FeatureCollection",
			features: vehicles.map((vehicle) =>
				point([vehicle.vehicle?.position?.longitude || 0, vehicle.vehicle?.position?.latitude || 0], {
					vehicle_id: vehicle.id,
					bearing: Number.parseInt(vehicle.vehicle?.position?.bearing || "0", 10),
				}),
			),
		};
	}, [vehicles]);

	console.log("markers", vehiclesGeoJSON);

	return (
		<>
			<div>
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
						console.log("ss", e);
						if (!e.features || e.features.length === 0) return;
						const feature = e.features[0];
						const entity = vehicles.find((v) => v.id === feature.properties?.vehicle_id);
						if (entity?.vehicle) setPopupEntity(entity.vehicle);
					}}
					onLoad={async (e) => {
						const map = e.target;
						// mapGl does not support svg, so we need to create an image first
						const img = new Image(20, 20);
						img.onload = () => map.addImage("vehicle-icon", img);
						img.src = navigationIcon;
					}}
				>
					<Source id="vehicles" type="geojson" data={vehiclesGeoJSON}>
						<Layer
							id="vehicles-layer"
							type="symbol"
							layout={{
								"icon-image": "vehicle-icon",
								"icon-size": 1.5,
								"text-field": ["get", "vehicle_id"],
								"icon-rotate": ["get", "bearing"],
							}}
							paint={{
								"text-color": "red",
							}}
						/>
					</Source>
					{popupEntity && (
						<Popup
							className="popup"
							longitude={popupEntity.position?.longitude || 0}
							latitude={popupEntity.position?.latitude || 0}
							anchor="bottom"
							onClose={() => setPopupEntity(null)}
						>
							<div>
								<p>ID: {popupEntity.vehicle?.id}</p>
								<p>RouteID: {popupEntity.trip?.route_id}</p>
								<p>Dir ID: {popupEntity.trip?.direction_id}</p>
							</div>
						</Popup>
					)}
				</MapGl>
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
