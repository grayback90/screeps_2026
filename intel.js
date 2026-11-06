/**********************************************
*
* file: intel.js
*
* funtions: saving the room data from the scout
*           searching the next room for the scout
*
**********************************************/

var config = require('config');

//returns the names of all rooms around the home room up to the given range
function getRoomsInRange(home, range) {
    //found = room name -> distance to the home room
    var found = {};
    found[home] = 0;
    var queue = [home];

    while(queue.length > 0) {
        //take the next room and look at its distance
        var name = queue.shift();
        var depth = found[name];

        //do not look further than the range
        if(depth >= range) {
            continue;
        }

        //add all neighbour rooms that we have not seen yet
        var exits = Game.map.describeExits(name);
        for(var direction in exits) {
            var next = exits[direction];
            if(found[next] === undefined) {
                found[next] = depth + 1;
                queue.push(next);
            }
        }
    }

    //the home room is not a target
    delete found[home];
    return Object.keys(found);
}

//returns true if the room can not be entered
//if the server has no status data for the room, it counts as open
function isRoomClosed(name) {
    try {
        return Game.map.getRoomStatus(name).status == 'closed';
    } catch(error) {
        return false;
    }
}

var intel = {

    //records the rooms and saves it to the scouts memory
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

        //keeper-lairs (we want to avoid these)
        info.keeperLairs = room.find(FIND_STRUCTURES, {filter: structure => structure.structureType == STRUCTURE_KEEPER_LAIR}).length;

        //sources and the coordinates
        info.sourceList = [];
        var sources = room.find(FIND_SOURCES);
        for(var i = 0; i < sources.length; i++) {
            info.sourceList.push({id: sources[i].id, x: sources[i].pos.x, y: sources[i].pos.y});
        }

        //controller position
        if (room.controller) {
            info.controllerPos = {x: room.controller.pos.x, y: room.controller.pos.y};
        } else {
            info.controllerPos = null;
        }

        //save all information in the scouts memory
        room.memory.scout = info;
    },

    //returns the name of the next room for the scout (never seen rooms first, then old ones), or null if there is nothing to scout
    getScoutTarget: function(creep) {
        //all rooms around the home room
        var rooms = getRoomsInRange(creep.memory.home, config.MAX_SCOUT_RANGE);

        var unvisited = [];
        var stale = [];
        for(var i = 0; i < rooms.length; i++) {
            var name = rooms[i];

            //skip rooms that can not be entered
            if(isRoomClosed(name)) {
                continue;
            }

            //get the saved data of the room (the chain avoids an error if there is no data yet)
            var data = Memory.rooms && Memory.rooms[name] && Memory.rooms[name].scout;
            if(!data) {
                //we have never been there
                unvisited.push(name);
            } else if(Game.time - data.time > config.SCOUT_STALE) {
                //the data is too old
                stale.push(name);
            }
        }

        //never seen rooms first, then the old ones, nothing to do if both are empty
        var candidates = unvisited.length > 0 ? unvisited : stale;
        if(candidates.length == 0) {
            return null;
        }

        //choose the room that is closest to the scout
        //best = closest room so far, bestDistance starts very high
        var best = null;
        var bestDistance = Infinity;
        for(var j = 0; j < candidates.length; j++) {
            var distance = Game.map.getRoomLinearDistance(creep.room.name, candidates[j]);
            if(distance < bestDistance) {
                best = candidates[j];
                bestDistance = distance;
            }
        }
        return best;
    },

    //returns the names of the neighbour rooms that are good for remote harvesting
    getRemoteRooms: function(home) {
        var remoteRooms = [];

        //check all direct neighbour rooms of the home room
        var exits = Game.map.describeExits(home);
        for(var direction in exits) {
            var name = exits[direction];

            //skip rooms that can not be entered
            if(isRoomClosed(name)) {
                continue;
            }

            //get the saved data of the room, skip the room if there is none
            var data = Memory.rooms && Memory.rooms[name] && Memory.rooms[name].scout;
            if(!data) {
                continue;
            }

            //skip rooms with old data (the situation could have changed) or data without the keeper-lairs info
            if(Game.time - data.time > config.SCOUT_STALE || data.keeperLairs === undefined) {
                continue;
            }

            //skip rooms without sources
            if(data.sources == 0) {
                continue;
            }

            //skip rooms that belong to somebody or are reserved
            if(data.owner || data.reservedBy) {
                continue;
            }

            //skip dangerous rooms: keeper-lairs, enemy creeps or enemy structures
            if(data.keeperLairs > 0 || data.hostiles > 0 || data.hostileStructures > 0) {
                continue;
            }

            remoteRooms.push(name);
        }

        return remoteRooms;
    }
};

module.exports = intel;