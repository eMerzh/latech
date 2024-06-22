import { distance, point } from "@turf/turf";
import { LngLat, MapGeoJSONFeature } from "maplibre-gl";

export function findNearestFeature(features: MapGeoJSONFeature[], clickPosition: LngLat) {
	if (features.length < 0) return null;
	const clickPoint = point([clickPosition.lng, clickPosition.lat]);
	const sorted = features.sort((a, b) => {
		if (a.geometry.type !== "Point" || b.geometry.type !== "Point") return 0;
		const ptA = point([a.geometry.coordinates[0], a.geometry.coordinates[1]]);
		const ptB = point([b.geometry.coordinates[0], b.geometry.coordinates[1]]);
		return distance(ptA, clickPoint) - distance(ptB, clickPoint);
	});
	return sorted[0];
}
