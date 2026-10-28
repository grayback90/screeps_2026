/**********************************************
*
* file: intel.js
*
* funtions: saving the room data from the scout
*
**********************************************/

var intel = {

    recordRoom: function(room) {
        //saves the time when the room is recorded
        var info = {time: Gamepad.time};
        //saves the count of sources
        info.sources = room.find(FIND_SOURCES).length;

        //save the room controller info
        if (room.controller) {
            info.level = room.controller.level;
            info.owner = room.controller.owner.username;
            info.reservedBy = room.controller.reservation.username;
        }

        //save the mineral info
        var minerals = room.find(FIND_MINERALS);
        for(var i = 0; i < minerals.length; i++) {
            info.mineralType = minerals[0];        
        }
        
        //save the hostile creeps and structures info
        info.hostiles = room.find(FIND_HOSTILE_CREEPS);
        info.hostileStructures = room.find(FIND_HOSTILE_STRUCTURES);

        //save the exits
        info.exits = Game.map.describeExits(room.name);

        room.memory.scout = info;

    }
};

module.exports = intel;