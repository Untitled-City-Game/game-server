import { LineString } from "geojson";
import { BoardProps } from 'boardgame.io/react';

export type geospatialFeature = {
	featureName : string,
	coords: { lat: number; lng: number; }[]
};

export interface PolyData extends geospatialFeature {
	matchedLines : LineData[]
}

export interface LineData extends geospatialFeature {
	matchedPolygons : string[]
}

export interface LineFeature extends GeoJSON.Feature {
			geometry: LineString;
			properties: GeoJSON.GeoJsonProperties & {Name: string};
		}
export interface PolygonFeature extends GeoJSON.Feature {
		geometry: GeoJSON.Polygon;
		properties: GeoJSON.GeoJsonProperties & {Name: string};
	}

export type zoneData = {
	id: number;
	status: zoneStatus;
	name: string;
	color: Color;
}

export type PlayerData = {
	playerID: `${number}`;
	name: string;
	teamColor: Color;
	playerCredentials?: string;
}

export type AllPlayersData = {
	[key:string] : PlayerData
}

export type Challenge = {
	title: string,
	description: string,
}

export type ChallengeData = Challenge[]

export type TeamData = {
	challengeDeck : Challenge[];
	challengeHand : Challenge[];
	challengeDiscard : Challenge[];
}

type AtLeastOneColor<T extends string> = {
	[K in T]?: TeamData; // Values can be anything, change type as needed
  } & {
	[K in T]: TeamData;
  }
  
export type AllTeamsData = AtLeastOneColor<Color>;

export interface GameState {
	zoneData: zoneData[],
	active: boolean,
	allPlayersData : AllPlayersData,
	allTeamsData : AllTeamsData
}

export type zoneStatus = Color | "empty";

export type GameSetupData = {
	zonePolygons: PolyData[];
	winningLines: LineData[];
}

// export interface ClientSetupData extends GameSetupData {
// 	initialPlayerData: PlayerData;
// 	playerID : `${number}`
// 	credentials?: string
// }

export type LogMetadata = {
	date: Date;
	evidence?: File;
	challenge?: string;
	zone?: number;
	team: Color;
}


type RGB = `rgb(${number}, ${number}, ${number})`;
type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`;
type HEX = `#${string}`;
type namedColor = "red" | "blue" | "green" | "yellow" | "purple" | "orange" | "black" | "white"| "grey";

export type Color = RGB | RGBA | HEX | namedColor;


