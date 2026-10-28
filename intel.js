/**********************************************
*
* file: intel.js
*
* funtions: saving the room data from the scout
*
**********************************************/

//constants
var MAX_SCOUT_RANGE = 2; //the range of rooms the scout can visit around the home room
var SCOUT_STALE = 10000; //outdated room data after this tick count


var intel = {

    recordRoom: function(room) {
        //saves the time when the room is recorded
        var info = {time: Game.time};
        //saves the count of sources
        info.sources = room.find(FIND_SOURCES).length;

        //save the room controller info
        if (room.controller) {
            info.level = room.controller.level;
            info.owner = room.controller.owner ? room.controller.owner.username : null;
            info.reservedBy = room.controller.reservation ? room.controller.reservation.username : null;
        }

        //save the mineral info
        var mineral = room.find(FIND_MINERALS);
        if(mineral.length > 0) {
            info.mineralType = mineral[0].mineralType;
        } else {
            info.mineralType = null;
        }
        
        //save the hostile creeps and structures info
        info.hostiles = room.find(FIND_HOSTILE_CREEPS).length;
        info.hostileStructures = room.find(FIND_HOSTILE_STRUCTURES).length;

        //save the exits
        info.exits = Game.map.describeExits(room.name);

        room.memory.scout = info;

    }
};

module.exports = intel;