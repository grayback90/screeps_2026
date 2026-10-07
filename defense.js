/**********************************************
*
* file: defense.js
* date: 07.10.2026
* version: 0.1.0
*
* funtions: detect threats in the rooms
*           saves the number of hostile creeps in the room memory
*
**********************************************/

var defense = {

    run: function() {

        //go through all rooms we can see
        for(var roomName in Game.rooms) {
            var room = Game.rooms[roomName];

            // skip rooms that are not ours
            if(!room.controller || !room.controller.my) {
                continue;
            }

            //find all hostile creeps in the room
            var hostiles = room.find(FIND_HOSTILE_CREEPS);

            //read the old count before we overwrite it
            var oldCount = room.memory.hostileCount || 0;

            //save the new count in the room memory
            room.memory.hostileCount = hostiles.length;

            //log only when the situation changes
            if(oldCount == 0 && hostiles.length > 0) {
                console.log('ALERT: ' + hostiles.length + ' hostile creep(s) in room ' + roomName);
            }
            if(oldCount > 0 && hostiles.length == 0) {
                console.log('All clear: no more hostile creeps in room ' + roomName);
            }
        }
    }
};

module.exports = defense;