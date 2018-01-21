var Sequelize = require('sequelize');
var db = new Sequelize('postgres://localhost:5432/diy_fall', {logging:false});
var crypto = require("crypto");

Location = db.define('location', {
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    roles: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    }
});

Player = db.define('player', {
    id: {
      allowNull: false,
      primaryKey: true,
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

Room = db.define('room', {
    id: {
        type: Sequelize.STRING,
        primaryKey: true,
        defaultValue: function(){
          return crypto.randomBytes(3).toString('hex');
        }
    }
});

Round = db.define('round', {
    startTime: {
        type: Sequelize.STRING,
        defaultValue: function(){
          return Date.now().toString();
        }
    },
    playerIds: {
      type: Sequelize.ARRAY(Sequelize.UUID),
      allowNull: false
    },
    locationIds: {
      type: Sequelize.ARRAY(Sequelize.INTEGER),
      allowNull: false
    }
});

Room.hasMany(Location);
Room.hasMany(Round);
Room.hasMany(Player);

module.exports = {
  db: db,
  Location: Location,
  Player: Player,
  Room: Room,
  Round: Round
};
