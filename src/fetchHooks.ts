import { useEffect, useState } from "react";
import { fetchRouteFeature } from "./routes";
import { Stop, getStops } from "./stops";

export const useFetchStops = () => {
	const [stops, setStops] = useState<Stop[]>([]);

	useEffect(() => {
		const fetchStops = async () => {
			const result = await getStops();
			setStops(result || []);
		};
		fetchStops();
	}, []);
	return stops;
};

export type RouteJson = GeoJSON.FeatureCollection | null;
export const useFetchSingleRoute = (selectedRouteCodeName: string | null): RouteJson => {
	const [routeJson, setRouteJson] = useState<RouteJson>(null);

	useEffect(() => {
		const fetchRoute = async (id: string) => {
			const result = await fetchRouteFeature(id);
			setRouteJson(result || []);
		};
		if (selectedRouteCodeName) {
			fetchRoute(selectedRouteCodeName);
		} else {
			setRouteJson(null);
		}
	}, [selectedRouteCodeName]);

	return routeJson;
};
