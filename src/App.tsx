import { useMemo, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import "./App.css";

import { point } from "@turf/turf";
import { Entity } from "gtfs-types";
import MapGl, { Source, Layer } from "react-map-gl/maplibre";
import navigationIcon from "/navigation.svg";
import { VehiculeInfoPopup } from "./VehiculeInfo";
import { getVehiculeSymbol } from "./assets/vehiculeSymbol";
import { fetchFeed } from "./feed";
import { routes } from "./routes";
import { getVehiculeSymbol } from "./vehiculeSymbol";

const url = `https://gtfsrt.tectime.be/proto/RealTime/vehicles?key=${import.meta.env.VITE_GTFS_KEY}`;
const mapURL = "https://api.maptiler.com/maps/bright/style.json?key=UVAKtN0Z84SNZiFO1wFP";

function App() {
	const [vehicles, setVehicles] = useState<Entity[]>([]);
	const [popupEntityId, setPopupEntityId] = useState<string | null>(null);

	const popupEntity = useMemo(() => vehicles.find((v) => v.id === popupEntityId)?.vehicle, [vehicles, popupEntityId]);

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
									route_short_name: "1",
									bearing: 0,
								}),
							],
				),
		};
	}, [vehicles]);

	console.log("vehicles", vehicles, popupEntity);
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
						if (!e.features || e.features.length === 0) return;
						const feature = e.features[0];
						const entity = vehicles.find((v) => v.id === feature.properties?.vehicle_id);

						if (entity?.vehicle) setPopupEntityId(entity.id);
					}}
					onLoad={async (e) => {
						const map = e.target;
						map.addImage("vehicle-icon", getVehiculeSymbol(100, map), { pixelRatio: 2 });
					}}
				>
					<Source id="vehicles" type="geojson" data={vehiclesGeoJSON}>
						<Layer
							id="vehicles-layer"
							type="symbol"
							layout={{
								"icon-image": "vehicle-icon",
								"icon-size": 1.6,
								"text-field": ["get", "route_short_name"],
								"icon-rotate": ["get", "bearing"],
								"text-size": 12,
							}}
							paint={{
								"text-color": "white",
							}}
						/>
					</Source>
					{popupEntity && <VehiculeInfoPopup entity={popupEntity} close={() => setPopupEntityId(null)} />}
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
