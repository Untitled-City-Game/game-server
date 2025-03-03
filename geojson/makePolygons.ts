import { LineData, PolyData, PolygonFeature } from "@/types";
import { Position } from "geojson";
import PointInPolygon from 'point-in-polygon';

export default function makePolygons(zoneDataObj: GeoJSON.FeatureCollection, zoneLines: LineData[]) {

	//filter to polygons
	const isPolygon = (zone: GeoJSON.Feature) => zone.geometry.type === "Polygon";
	const polygons : GeoJSON.Feature[] = zoneDataObj.features.filter(isPolygon);
	//filter to polygons with valid properties and coordinates
	const isValidPolygon = (zone: GeoJSON.Feature): zone is PolygonFeature => {return 'properties' in zone && 'geometry' in zone && 'coordinates' in zone.geometry && zone.geometry.coordinates.length > 0;}
	const validPolygons = polygons.filter(isValidPolygon);
	//Create the zones
	const zonePolygons = validPolygons.map((zone: PolygonFeature) => {
		const zoneName: string = zone.properties.Name;
		//Find lines which have a point in the polygon
		const matchedLines = zoneLines.filter((line: LineData) => {
			return line.coords.some((coord) => PointInPolygon([coord.lng, coord.lat], zone.geometry.coordinates[0]));
		});

		//convert coords to latlong (for some reason polygon has an extra array layer than polyline)
		const zoneCoords = zone.geometry.coordinates[0].map((coord: Position) => {
			const latlong = coord as number[];
			return {lat: latlong[1], lng: latlong[0]}
		})
		const newPoly: PolyData = {featureName: zoneName, coords: zoneCoords, matchedLines : matchedLines};
		//add matched lines to the line's matchedPolygons
		matchedLines.forEach((line) => {
			line.matchedPolygons.push(newPoly.featureName); //TODO: Unique IDs
		});
		return newPoly;
	})
	
	return zonePolygons;
}


