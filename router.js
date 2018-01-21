require('bluebird');
require('./models');
var Utils = require('./js/common.js');

var express = require('express');
var router = express.Router();
const shuffleSeed = require('shuffle-seed');
// Room

router.post('/rooms', (req, res, next) => {
	Room.create()
	.then( (room) => {
		res.send(room)
	})
	.catch(next);
});

// (unused)
router.get('/rooms',function(req,res,next){
	Room.findAll()
	.then( (rooms) => {
		res.send(rooms);
	})
	.catch(next);
})

// Player

router.post('/players/room/:roomId', (req, res, next) => {
	Room.findById(req.params.roomId)
	.then( (room) => {
		Player.create({
			name: req.body.name
		})
		.then( (player) => {
			return room.addPlayer(player)
		})
		.then( (player) => {
			res.send(player)
		})
	})
	.catch(next);
});

//(unused)
router.get('/players', (req, res, next) => {
	Player.findAll()
	.then( (player) => {
		res.send(player)
	})
	.catch(next);
});

router.get('/players/room/:roomId', (req, res, next) => {
	Room.findById(req.params.roomId)
	.then( (room) => {
		return room.getPlayers()
	}).then( (players) => {
		res.send(players)
	})
	.catch(next);
});

// Location

router.post('/locations/room/:roomId', (req, res, next) => {
	Room.findById(req.params.roomId)
	.then( (room) => {
		Location.create({
				name: req.body.name,
				roles: req.body.roles
			})
		.then( (location) => {
			room.addLocation(location)
		})
		.then(() => {
			res.sendStatus(201)
		})
		.catch(next);
	})
	.catch(next);
});

router.get('/locations/room/:roomId', (req, res, next) => {
	Room.findById(req.params.roomId)
	.then((room) => {
		return room.getLocations()
	}).then( (locations) => {
		res.send(locations)
	})
	.catch(next);
});

// Round

//(unused)
router.get('/rounds', (req, res, next) => {
	Round.findAll()
	.then( (rounds) => {
		res.send(rounds)
	})
	.catch(next);
});

router.post('/rounds/room/:roomId', (req, res, next) => {
	Room.findById(req.params.roomId)
	.then( (room) => {
		const getPlayers = room.getPlayers();
		const getLocations = room.getLocations();
		Promise.all([getPlayers, getLocations])
		.then( ([players, locations]) => {
			const playerIds = [...players].map( (p) => p.id);
			const locationIds = [...locations]
				.filter( (l) => l.isActive)
				.map( (l) => l.id);
			Round.create({playerIds: playerIds, locationIds: locationIds})
			.then( (round) => {
				room.addRound(round);
			})
			.then( () => {
				res.sendStatus(201);
			})
			.catch(next);
		})
		.catch(next);
	})
	.catch(next);
});

router.get('/rounds/my-data/room/:roomId/player/:playerId', (req, res, next) => {
	const { playerId, roomId } = req.params;
	Room.findById(roomId)
	.then( (room) => {
		const getRounds = room.getRounds();
		const getLocations = room.getLocations();
		return Promise.all([getRounds, getLocations])
	})
	.then( ([rounds, locations]) => {
		const currentRound = getMostRecentRound(rounds);
		const validLocations =
			locations.filter( (l) => {
				return currentRound.locationIds.includes(l.id)
			})
		const roundData = compileRoundData(currentRound, validLocations);
		if(roundData.spyId === playerId){
			res.send({
				role: "Spy",
				location: null
			})
		}
		else if(roundData.idToRole[playerId]){
			res.send({
				role: roundData.idToRole[playerId],
				location: roundData.location
			})
		}
		else{
			res.send("GTFO of here")
		}
	})
});

function getMostRecentRound(rounds){
	return ([...rounds].sort( (a, b) => {
			return new Date(a.createdAt) < new Date(b.createdAt)? -1 : 1;
		})
		.pop());
}

function compileRoundData(round, locations){
	const location =
		shuffleSeed.shuffle(locations, round.id).pop();
	const shuffledPlayerIds =
		shuffleSeed.shuffle(round.playerIds, "secret"+round.id+"sauce");
	const [spyId, ...nonSpyIds] = shuffledPlayerIds;
	const idToRole = nonSpyIds.reduce( (acc, id, idx) => {
		acc[id] = location.roles[idx % location.roles.length]
		return acc;
	}, {})
	return {
		location: location.name,
		spyId: spyId,
		idToRole: idToRole
	}

}

module.exports = router;
