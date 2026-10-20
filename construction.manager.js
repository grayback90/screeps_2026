/**********************************************
*
* file: construction.manager.js
* date: 20.10.2026
* version: 0.2.0
*
* funtions: places construction sites automatically
*           extensions: checkerboard pattern around the spawn
*
**********************************************/

//constants
var EXTENSION_SEARCH_RANGES = [6, 8, 10]; //how far from the spawn the extensions are placed (in tiles), the next range is used if there are not enough free tiles
var CONSTRUCTION_INTERVAL = 50; //the manager checks every x ticks if something has to be built
var MAX_CONSTRUCTION_SITES = 5; //max number of construction sites in a room at the same time

//returns the positions for the next extensions (closest to the spawn first)
//pattern: checkerboard, so the creeps can still walk between the extensions
function getExtensionPositions(room, count, range) {

    //we need a spawn as the center of the pattern
    var spawn = room.find(FIND_MY_SPAWNS)[0];
    if(!spawn) {
        return [];
    }

    //terrain to find walls, sources and controller to keep their surroundings free
    var terrain = room.getTerrain();
    var sources = room.find(FIND_SOURCES);
    var positions = [];

    //check every tile around the spawn
    for(var dx = -range; dx <= range; dx++) {
        for(var dy = -range; dy <= range; dy++) {

            //distance to the spawn, the ring directly around the spawn stays free
            var distance = Math.max(Math.abs(dx), Math.abs(dy));
            if(distance < 2) {
                continue;
            }

            //checkerboard: only every second tile
            if((Math.abs(dx) + Math.abs(dy)) % 2 != 0) {
                continue;
            }

            var x = spawn.pos.x + dx;
            var y = spawn.pos.y + dy;

            //keep away from the border of the room
            if(x < 2 || x > 47 || y < 2 || y > 47) {
                continue;
            }

            //no walls
            if(terrain.get(x, y) == TERRAIN_MASK_WALL) {
                continue;
            }

            //skip tiles where something is already built or planned
            if(room.lookForAt(LOOK_STRUCTURES, x, y).length > 0 || room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y).length > 0) {
                continue;
            }

            //keep the tiles next to sources and the controller free (creeps work there)
            var pos = new RoomPosition(x, y, room.name);
            var tooClose = false;
            for(var i = 0; i < sources.length; i++) {
                if(pos.getRangeTo(sources[i]) <= 1) {
                    tooClose = true;
                }
            }
            if(room.controller && pos.getRangeTo(room.controller) <= 1) {
                tooClose = true;
            }
            if(tooClose) {
                continue;
            }

            positions.push({x: x, y: y, distance: distance});
        }
    }

    //closest to the spawn first
    positions.sort(function(a, b) { return a.distance - b.distance; });

    //return only as many as needed
    return positions.slice(0, count);
}

var constructionManager = {

    run: function() {

        //check only every CONSTRUCTION_INTERVAL ticks, this saves cpu
        if(Game.time % CONSTRUCTION_INTERVAL != 0) {
            return;
        }

        for(var roomName in Game.rooms) {
            var room = Game.rooms[roomName];

            //skip rooms that are not ours
            if(!room.controller || !room.controller.my) {
                continue;
            }

            //do not build while enemies are in the room
            if(room.memory.hostileCount > 0) {
                continue;
            }

            //how many extensions are allowed on this controller level
            var allowed = CONTROLLER_STRUCTURES[STRUCTURE_EXTENSION][room.controller.level] || 0;

            //how many extensions exist and how many are already planned
            var extensions = room.find(FIND_MY_STRUCTURES, {filter: (structure) => structure.structureType == STRUCTURE_EXTENSION});
            var sites = room.find(FIND_MY_CONSTRUCTION_SITES);
            var extensionSites = _.filter(sites, (site) => site.structureType == STRUCTURE_EXTENSION);

            //how many extensions are missing
            var missing = allowed - extensions.length - extensionSites.length;
            if(missing <= 0) {
                //nothing is missing anymore, the old warning is not needed anymore
                delete room.memory.constructionWarning;
                continue;
            }

            //how many new construction sites are allowed right now
            var freeSlots = MAX_CONSTRUCTION_SITES - sites.length;
            if(freeSlots <= 0) {
                continue;
            }

            //how many extensions we want to place now: the missing ones, but not more than the free slots
            var wanted = Math.min(missing, freeSlots);

            //search with a small range first, use a bigger range only if there are not enough free tiles
            var positions = [];
            for(var r = 0; r < EXTENSION_SEARCH_RANGES.length; r++) {
                positions = getExtensionPositions(room, wanted, EXTENSION_SEARCH_RANGES[r]);
                if(positions.length >= wanted) {
                    break;
                }
            }

            //warn (only when the message changes) if even the biggest range has not enough free tiles
            var warning = '';
            if(positions.length < wanted) {
                warning = 'only ' + positions.length + ' of ' + wanted + ' extension places found, place the rest by hand';
            }
            if(warning != (room.memory.constructionWarning || '')) {
                if(warning) {
                    console.log('Construction: ' + warning + ' in room ' + roomName);
                    room.memory.constructionWarning = warning;
                } else {
                    delete room.memory.constructionWarning;
                }
            }

            //place the found extensions
            for(var i = 0; i < positions.length; i++) {
                var result = room.createConstructionSite(positions[i].x, positions[i].y, STRUCTURE_EXTENSION);
                if(result != OK) {
                    console.log('Construction: could not place extension at ' + positions[i].x + '/' + positions[i].y + ': ' + result);
                }
            }
            if(positions.length > 0) {
                console.log('Construction: placed ' + positions.length + ' extension site(s) in room ' + roomName);
            }
        }
    }
};

module.exports = constructionManager;