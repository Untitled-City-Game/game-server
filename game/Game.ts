import { GameState, AllPlayersData, PolyData, zoneData, zoneStatus, PlayerData, AllTeamsData, Color, ChallengeData, TeamData, LogMetadata } from "@/types";
import type { Ctx, FnContext, Game } from "boardgame.io";
import { LogAPI } from "boardgame.io/dist/types/src/plugins/plugin-log";
import { RandomAPI } from "boardgame.io/dist/types/src/plugins/random/random";
import challengeDataJSON from '@data/challenges.json'
const challengeData : ChallengeData = challengeDataJSON
import { remove } from "lodash";
// function functionMove({G, ctx, playerID}: FnContext<GameState>, claimId: number, teamID: zoneNames, ...args: unknown[]){
// 	G.zones[claimId] = teamID;
// 	console.log(playerID);
// 	return { ...G };
// }

const handSize = 5;

function addLogMetadata({log} : {log : LogAPI}, metadata: LogMetadata){
	console.log("adding metadata", metadata)
	log.setMetadata(metadata);
}

function completeChallengeAndClaim(
	{ G, log, playerID }: { G: GameState, log : LogAPI , playerID: string },
	zoneID: number,
	challenge: string,
	evidence: string
) {
	console.log("complete challenge and claim", zoneID, challenge, "evidence", evidence ? evidence : "no evidence")
	completeChallenge({ G, log, playerID }, challenge, evidence);
	claimZone({ G, log, playerID }, zoneID);
	drawToFull({ G, playerID });
	addLogMetadata({log}, {date: new Date(), zone: zoneID, team: G.allPlayersData[playerID].teamColor, challenge, evidence});
}

function claimZone(
	{ G, log, playerID }: { G: GameState, log : LogAPI , playerID: string },
	zoneID: number,

) {
	console.log("claiming zone", zoneID);
	const claimedZone = G.zoneData[zoneID];
	claimedZone.color = G.allPlayersData[playerID].teamColor;
	log.setMetadata("test");
	//addLogMetadata({log}, {date: new Date(), zone: zoneID, team: claimedZone.color});
}

function completeChallenge({ G, log, playerID }: { G: GameState, log : LogAPI , playerID: string },
	challenge: string,
	evidence: string
){
	console.log("completing challenge", challenge, evidence)
	discardChallenge({ G, log, playerID }, challenge);
	addLogMetadata({log}, {date: new Date(), challenge, evidence, team: G.allPlayersData[playerID].teamColor});
}

function discardChallenge(
	{ G, log, playerID }: { G: GameState, log : LogAPI , playerID: string },
	challenge: string,
) {
	const team = G.allPlayersData[playerID].teamColor
	//remove challenge from challenge hand
	const teamData = G.allTeamsData[team]
	const removedChallenge = remove(teamData.challengeHand, challengeInHand => challengeInHand.title === challenge)
	teamData.challengeDiscard.concat(removedChallenge)
	console.log("removed challenge from hand", challenge);
}

function drawChallenge(
	{ G, playerID }: { G: GameState, playerID: string },
){
	//draw a challenge from deck
	const teamData = G.allTeamsData[G.allPlayersData[playerID].teamColor]
	const drawnChallenge = teamData.challengeDeck.pop()
	if (drawnChallenge){
		teamData.challengeHand.push(drawnChallenge)
		console.log("drawn challenge", drawnChallenge.title)
	}
	else{
		console.log("no cards left in deck")
		//TODO: add error message
	}
}

function drawToFull(
	{ G, playerID }: { G: GameState, playerID: string },
){
	console.log("drawing to full", playerID)
	let i = 0;
	const teamData = G.allTeamsData[G.allPlayersData[playerID].teamColor]
	while (teamData.challengeHand.length < handSize) {
		drawChallenge({ G, playerID });
		i++;
		if (i > handSize){
			console.log("error: couldn't draw to full")
			break;
		}
	}
}

function playerSetup(
	{ G, playerID }: { G: GameState , playerID: string },
	newPlayerData : PlayerData
){
	G.allPlayersData[playerID] = newPlayerData
	console.log("setup player", playerID, newPlayerData, newPlayerData.name, newPlayerData.teamColor)
}

function startGame({ events, G, random, log }: FnContext<GameState>) {
	console.log("starting game")
	//shuffle and create decks
	events.setActivePlayers({ all: "claim" });
	teamSetup(G.allTeamsData, random)
	G.active = true;
	addLogMetadata({log}, {date : new Date(), team : G.allPlayersData[0].teamColor});
}

function teamSetup(teams : AllTeamsData, random : RandomAPI){
	console.log("setting up teams")
	//iterate over keys in teams object
	for (const teamColor in teams){
		console.log("team color: ", teamColor);
		const shuffledDeck = random.Shuffle(challengeData);
		teams[teamColor as Color] = {
			challengeDeck: shuffledDeck, 
			challengeHand: shuffledDeck.slice(0, 5),
			challengeDiscard: []
		}
	}
}

export const MetroMayhem = (internalSetupData: PolyData[]): Game<GameState> => {
	console.log("running metromayhem function")
	return {
		name: "metro-mayhem",
		//set up game board using map json info
		setup: ({ctx}) => gameSetup(internalSetupData, ctx),
		moves: {
			claimZone,
			startGame,
			playerSetup,
		},
		turn: {
			onBegin: ({events}) => {events.setActivePlayers({all: "join"})},
			stages: {
				join: {
					moves: {
						playerSetup,
						startGame
					}
				},
				claim: {
					moves: claimStateMoves
				},
			},
		},
	};
};

const claimStateMoves ={
	claimZone,
	playerSetup,
	drawChallenge,
	drawToFull,
	discardChallenge,
	completeChallenge,
	completeChallengeAndClaim
}

export type ClaimStateMoves = StripContext<typeof claimStateMoves>

function gameSetup(internalSetupData: PolyData[], ctx: Ctx): GameState {
	console.log("Setting up game of metromayhem");
	console.log("players: ", ctx.numPlayers);
	console.log("currentplayer ", ctx.currentPlayer);
	return {
		zoneData: createBoardFromMapJson(internalSetupData),
		active: false,
		allPlayersData : {} as AllPlayersData,
		//declare allteamsdata as AllTeamsData object
		allTeamsData : {
			red: {} as TeamData,
			blue: {} as TeamData
		} as AllTeamsData,
	};
}

function createBoardFromMapJson(internalSetupData: PolyData[]): zoneData[] {
	return internalSetupData.map((zone, index) => {
		return {
			id: index,
			status: "empty",
			name: zone.featureName,
			color: "grey",
		};
	}
	);
}

type StripContext<T> = {
    [K in keyof T]: T[K] extends (context: infer C, ...args: infer A) => infer R
        ? (...args: A) => R
        : never;
};