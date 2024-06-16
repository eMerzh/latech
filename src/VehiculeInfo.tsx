import { VehiclePosition, VehicleStopStatus } from "gtfs-types";
import { Popup } from "react-map-gl/maplibre";
import { routes } from "./routes";

const VehiculeStatusLabel = {
	[VehicleStopStatus.INCOMING_AT]: "Incoming at",
	[VehicleStopStatus.STOPPED_AT]: "Stopped at",
	[VehicleStopStatus.IN_TRANSIT_TO]: "In transit to",
};

export const VehiculeInfo = ({ entity }: { entity: VehiclePosition; close: () => void }) => {
	const route = routes[entity.trip?.route_id || ""];
	if (!route) return <>Unknown Route</>;
	return (
		<div>
			<p>
				Route: <b>{route.route_short_name}</b>
				<br />
				{route.route_long_name}
			</p>
			{entity.current_status !== undefined && <p>Status : {VehiculeStatusLabel[entity.current_status]}</p>}
			<p>Speed: {entity.position?.speed}</p>
			<p>Stop: {entity.stop_id}</p>
			<p>Dir ID: {entity.trip?.direction_id}</p>
			{/* current_stop_sequence
			trip.start_time:
			 */}
		</div>
	);
};

export const VehiculeInfoPopup = ({ entity, close }: { entity: VehiclePosition; close: () => void }) => {
	return (
		<Popup
			className="popup"
			longitude={entity.position?.longitude || 0}
			latitude={entity.position?.latitude || 0}
			anchor="bottom"
			onClose={close}
		>
			<VehiculeInfo entity={entity} close={close} />
		</Popup>
	);
};
