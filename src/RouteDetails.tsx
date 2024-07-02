import { ThemeIcon, Timeline } from "@mantine/core";
import { IconBusStop, IconSignLeftFilled } from "@tabler/icons-react";
import { VehiclePosition } from "gtfs-types";
import { RouteJson } from "./fetchHooks";

interface Props {
	routeJson: RouteJson;
	vehicules: VehiclePosition[];
}
const RouteDetails = ({ routeJson, vehicules }: Props) => {
	//
	const routeStops = routeJson?.features.filter((feature) => feature.geometry.type === "Point");
	const vehiculesStops = vehicules.map((v) => v.stop_id);
	console.log(
		{ routeStops, vehicules, vehiculesStops },
		routeStops?.map((stop) => stop.properties?.stop_id),
	);

	return (
		<Timeline bulletSize={24} lineWidth={2} ml="md" mt="md">
			{routeStops?.map((stop) => (
				<Timeline.Item
					key={stop.id}
					bullet={
						<ThemeIcon
							size={22}
							variant={vehiculesStops.includes(stop.properties?.stop_id) ? "gradient" : "filled"}
							color="tecYellow.1"
							gradient={{ from: "tecRed", to: "tecYellow" }}
							radius="xl"
							autoContrast
						>
							{vehiculesStops.includes(stop.properties?.stop_id) ? (
								<IconBusStop size={12} />
							) : (
								<IconSignLeftFilled size={12} />
							)}
						</ThemeIcon>
					}
					title={stop.properties?.stop_name}
				/>
			))}
		</Timeline>
	);
};

export default RouteDetails;
