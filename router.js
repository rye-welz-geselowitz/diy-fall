require('bluebird');
require('./models');
var Utils = require('./js/common.js');

var express = require('express');
var router = express.Router();

// Room

router.post('/rooms', (req, res, next) => {
	Room.create()
	.then(function(room){
		res.send(room)
	})
	.catch(next);
});

// (unused)
router.get('/rooms',function(req,res,next){
	Room.findAll()
	.then(function(rooms){
		res.send(rooms);
	})
	.catch(next);
})

// Player

router.post('/players', (req, res, next) => {
	Room.findById(req.body.roomId)
	.then(function(room){
		Player.create({
			name: req.body.name
		})
		.then(function(player){
			return room.addPlayer(player)
		})
		.then(function(player){
			res.send(player)
		})
	})
	.catch(next);
});

//(unused)
router.get('/players', (req, res, next) => {
	Player.findAll()
	.then(function(player){
		res.send(player)
	})
	.catch(next);
});

router.get('/players/room/:roomId', (req, res, next) => {
	Room.findById(req.params.roomId)
	.then(function(room){
		return room.getPlayers()
	}).then(function(players) {
		res.send(players)
	})
	.catch(next);
});

// Location

router.post('/locations', (req, res, next) => {
	var locationPromise =
		Location.create({
			name: req.body.name
		})
	var newRoles =
		req.body.roleNames.map(function(roleName){
			return {name: roleName}
		})
	var rolesPromise = Role.bulkCreate(newRoles, {returning: true});
	Room.findById(req.body.roomId)
	.then(function(room){
		Promise.all([locationPromise, rolesPromise])
		.then(function([location, roles]){
			var roleIds = roles.map(function(roleObj){
				return roleObj.dataValues.id
			})
			return location.addRoles(roleIds);
		})
		.then(function(location){
			return room.addLocation(location);
		})
		.then(function(){
			res.sendStatus(201)
		})
		.catch(next)
	})
	.catch(next);
});

router.get('/locations/room/:roomId', (req, res, next) => {
	Room.findById(req.params.roomId)
	.then(function(room){
		return room.getLocations()
	}).then(function(locations) {
		res.send(locations)
	})
	.catch(next);
});

// Round

//(unused)
router.get('/rounds', (req, res, next) => {
	Round.findAll()
	.then(function(rounds){
		res.send(rounds)
	})
	.catch(next);
});

router.post('/rounds', (req, res, next) => {
	Room.findById(req.body.roomId)
	.then(function(room){
		Round.create()
		.then(function(round) {
			room.setRound(round)
			.then(function() {
				return room.getLocations();
			})
			.then(function(locations) {
				var secretLocation = Utils.getRandomItem(locations);
				var setLocation = round.setLocation(secretLocation);

				var getRoles = secretLocation.getRoles();

				var getPlayers = room.getPlayers();

				Promise.all([setLocation, getRoles, getPlayers])
				.then(function([ _, roles, players]){
					var spyPlayer = Utils.getRandomItem(players);
					var updatePlayerPromises = players.map(function(player){
						return player.update({
							isSpy: (player.id == spyPlayer.id)
						});
					})
					Utils.shuffle(roles);
					var nonSpyPlayers = players.filter(function(p){
						return p.id != spyPlayer.id;
					})
					for(var i =0; i<nonSpyPlayers.length;i++){
						var role = roles[i%roles.length];
						updatePlayerPromises.push(role.addPlayer(nonSpyPlayers[i])); //TODO: clear spy player's role?
					}
					Promise.all(updatePlayerPromises)
				})
				.then(function(){
					res.sendStatus(201)
				})
				.catch(next)
			})
		})
	})
	.catch(next);
});

//TODO: not done yet!!!
router.get('/rounds/my-data/room/:roomId/player/:playerId', (req, res, next) => {
	var getPlayer = Player.findById(req.params.playerId);
	var getRoom = Room.findById(req.params.roomId);
	//var getRound = Round.findOne() --TODO: get round start time!

	Promise.all([getPlayer, getRoom])
	.then(function([player, room]){

		if(player.isSpy){
			res.send({name: "Spy", location: null})
		}
		var getRole = player.getRole(); //TODO: this is not a function
		var getLocation = room.getLocation();
		return Promise.all(getRole, getLocation)
	})
	.then(function([role, location]){
		res.send({
			role: role.name,
			location: location.name
		})
	})
	.catch(next);
});


module.exports = router;
