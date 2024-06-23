import routesList from "./routes.json";

export type RouteItem = (typeof routesList)[number];
export const routes: Record<string, RouteItem> = {};

for (const r of routesList) {
	routes[r.route_id] = r;
}

const FeatureRoutes = new Map<string, GeoJSON.FeatureCollection>();

export const fetchRouteFeature = async (routeCode: string): Promise<GeoJSON.FeatureCollection> => {
	if (FeatureRoutes.has(routeCode)) {
		// biome-ignore lint/style/noNonNullAssertion: TS doesn't understand the Map.has check
		return FeatureRoutes.get(routeCode)!;
	}
	const routeUrl = new URL(`/routes/${routeCode}.geojson`, import.meta.url).href;

	const resut = await fetch(routeUrl);
	const data = await resut.json();
	FeatureRoutes.set(routeCode, data);
	return data;
};
