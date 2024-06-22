import { parquetRead } from "hyparquet";

export type Stop = [
	/** stop_id */
	string,
	/** stop_name */
	string,
	/** stop_lat */
	number,
	/** stop_lon */
	number,
];
export const getStops = async () => {
	const res = await fetch("/stops.parquet");
	const arrayBuffer = await res.arrayBuffer();

	const result = new Promise<Stop[]>((resolve) => {
		parquetRead({
			file: arrayBuffer,
			columns: ["stop_id", "stop_name", "stop_lat", "stop_lon", "route_id"], // include columns
			onComplete: (data) => {
				resolve(data as Stop[]);
			},
		});
	});
	return result;
};
