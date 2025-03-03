import { Server, Origins } from 'boardgame.io/server';
import {promises as fs} from 'fs';
import { MetroMayhem } from './game/Game';
import { LineData, PolyData, GameSetupData } from './types';
import makeLines from '@geojson/makeLines';
import makePolygons from '@geojson/makePolygons';


async function fetchData(){
	const zoneData = await fs.readFile(process.cwd() + '/data/melbourne.geojson', 'utf8');
	const zoneDataObj: GeoJSON.FeatureCollection = JSON.parse(zoneData);
	const zoneLines: LineData[] = makeLines(zoneDataObj);
	const zonePolygons: PolyData[] = makePolygons(zoneDataObj, zoneLines);
	return {zonePolygons : zonePolygons, winningLines: zoneLines};
}

async function buildServer(){
	console.log("building server")
	const mapData : GameSetupData = await fetchData();
	const server = Server({
		games: [MetroMayhem(mapData.zonePolygons)],
		origins: [Origins.LOCALHOST],
	});
	server.router.get('/hello', (ctx) => {
		ctx.body = 'Hello ee!';
	  });
	server.router.get('/map-data', (ctx) => {
		ctx.body = mapData;
	  });
	const port = parseInt(process.env.PORT || '8000');
	server.run(port, () => console.log("server running..."));
}

buildServer();