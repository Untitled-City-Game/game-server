import { Position } from "geojson";
import { LineFeature, LineData } from "@/types";

export default function makeLines(regionDataObj: GeoJSON.FeatureCollection) {
	//filter to polylines
	const isPolyLine = (line: GeoJSON.Feature) => line.geometry.type === "LineString";
	const polyLines : GeoJSON.Feature[] = regionDataObj.features.filter(isPolyLine);

	//filter to polylines with valid properties and coordinates
	const isValidPolyLine = (line: GeoJSON.Feature): line is LineFeature => {return 'properties' in line && 'geometry' in line && 'coordinates' in line.geometry && line.geometry.coordinates.length > 0;}
	const validPolyLines = polyLines.filter(isValidPolyLine);

	//Create the lines
	const regionLines : LineData[] = validPolyLines.map((line: LineFeature) => {
		const lineName: string = line.properties.Name
		//convert coords to latlong
		const lineCoords = line.geometry.coordinates.map((coord: Position) => {
			const latlong = coord as number[];
			return {lat: latlong[1], lng: latlong[0]}
		})
		return {featureName: lineName, coords: lineCoords, matchedPolygons: []};
	})
	return regionLines;
}