import { VehiclePosition, VehicleStopStatus } from "gtfs-types";
import { Popup } from "react-map-gl/maplibre";
import { routes } from "./routes";
import { Stop } from "./stops";

const VehiculeStatusLabel = {
	[VehicleStopStatus.INCOMING_AT]: "Incoming at",
	[VehicleStopStatus.STOPPED_AT]: "Stopped at",
	[VehicleStopStatus.IN_TRANSIT_TO]: "In transit to",
};

const VehiculeInfo = ({ entity, stops }: Props) => {
	const route = routes[entity.trip?.route_id || ""];
	if (!route) return <>Unknown Route</>;
	const stop = stops.find((stop) => stop[0] === entity.stop_id);

	return (
		<div>
			<p>
				<strong>Route:</strong> <b>{route.route_short_name}</b>
				<br />
				{route.route_long_name}
			</p>
			{entity.current_status !== undefined && (
				<p>
					<strong>Status :</strong> {VehiculeStatusLabel[entity.current_status]}
				</p>
			)}
			<p>
				<strong>Speed:</strong> {entity.position?.speed} <i>km/h</i>
			</p>
			<p>
				<strong>Stop:</strong> {stop?.[1]}
			</p>
			<p>
				<strong>Angle:</strong> {entity.position?.bearing}
			</p>
		</div>
	);
};

interface Props {
	entity: VehiclePosition;
	close: () => void;
	stops: Stop[];
}
export const VehiculeInfoPopup = ({ entity, close, stops }: Props) => {
	return (
		<Popup
			offset={10}
			anchor="bottom"
			className="popup"
			longitude={entity.position?.longitude || 0}
			latitude={entity.position?.latitude || 0}
			onClose={close}
		>
			<VehiculeInfo entity={entity} close={close} stops={stops} />
		</Popup>
	);
};
