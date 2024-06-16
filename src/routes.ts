import routesList from "./routes.json";

export const routes: Record<string, (typeof routesList)[number]> = {};

for (const r of routesList) {
	routes[r.route_id] = r;
}
