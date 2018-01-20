var Sequelize = require('sequelize');
var db = new Sequelize('postgres://localhost:5432/diy_fall', {logging:false});
var crypto = require("crypto");

Location = db.define('location', {
    name: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

Role = db.define('role', {
    name: {
        type: Sequelize.STRING,
        allowNull: false
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
    },
    isSpy: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
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
    }
});


Room.hasMany(Player);
Role.hasMany(Player);
//Player.belongsTo(Role)
Location.hasMany(Role);

Round.belongsTo(Location);
Room.hasMany(Location);
Room.hasOne(Round);

module.exports = {
  db: db,
  Location: Location,
  Role: Role,
  Player: Player,
  Room: Room,
  Round: Round
};
