/**********************************************
*
* file: construction.manager.js
* date: 20.10.2026
* version: 0.4.0
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

//returns the best free tile next to a source for a container (closest to the spawn), or null if there is none
function getContainerPosition(room, source) {
    //we need a spawn to find the shortest way
    var spawn = room.find(FIND_MY_SPAWNS)[0];
    if(!spawn) {
        return null;
    }

    var terrain = room.getTerrain();

    //best = free tile closest to the spawn so far
    //bestDistance starts very high, so the first free tile is always better
    var best = null;
    var bestDistance = Infinity;

    //check the eight tiles around the source
    for(var dx = -1; dx <= 1; dx++) {
        for(var dy = -1; dy <= 1; dy++) {

            //this is the source itself
            if(dx == 0 && dy == 0) {
                continue;
            }

            var x = source.pos.x + dx;
            var y = source.pos.y + dy;

            //no walls
            if(terrain.get(x, y) == TERRAIN_MASK_WALL) {
                continue;
            }

            //skip tiles where something is already built or planned
            if(room.lookForAt(LOOK_STRUCTURES, x, y).length > 0 || room.lookForAt(LOOK_CONSTRUCTION_SITES, x, y).length > 0) {
                continue;
            }

            //closer to the spawn than the best tile so far -> new best
            var distance = spawn.pos.getRangeTo(x, y);
            if(distance < bestDistance) {
                best = {x: x, y: y};
                bestDistance = distance;
            }
        }
    }

    return best;
}

//places a container construction site next to every source that has no container yet
function placeContainers(room) {

    //count the construction sites, we do not want to place more than MAX_CONSTRUCTION_SITES
    var siteCount = room.find(FIND_MY_CONSTRUCTION_SITES).length;
    if(siteCount >= MAX_CONSTRUCTION_SITES) {
        return;
    }

    var sources = room.find(FIND_SOURCES);
    for(var i = 0; i < sources.length; i++) {

        //is there already a container or a container site next to the source?
        var containers = sources[i].pos.findInRange(FIND_STRUCTURES, 1, {filter: (structure) => structure.structureType == STRUCTURE_CONTAINER});
        var containerSites = sources[i].pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {filter: (site) => site.structureType == STRUCTURE_CONTAINER});
        if(containers.length > 0 || containerSites.length > 0) {
            continue;
        }

        //find the best tile, skip the source if there is no free tile
        var pos = getContainerPosition(room, sources[i]);
        if(!pos) {
            continue;
        }

        //place the construction site
        var result = room.createConstructionSite(pos.x, pos.y, STRUCTURE_CONTAINER);
        if(result == OK) {
            console.log('Construction: placed container site at ' + pos.x + '/' + pos.y + ' in room ' + room.name);
            siteCount++;
        } else {
            console.log('Construction: could not place container at ' + pos.x + '/' + pos.y + ': ' + result);
        }

        //stop if the limit of construction sites is reached
        if(siteCount >= MAX_CONSTRUCTION_SITES) {
            return;
        }
    }
}

//places a tower construction site if the controller level allows more towers
//this ignores MAX_CONSTRUCTION_SITES on purpose, the tower must not wait for the extensions
function placeTowers(room) {
    //how many towers are allowed on this controller level
    var allowed = CONTROLLER_STRUCTURES[STRUCTURE_TOWER][room.controller.level] || 0;
    if(allowed == 0) {
        return;
    }

    //how many towers exist and how many are already planned
    var towers = room.find(FIND_MY_STRUCTURES, {filter: (structure) => structure.structureType == STRUCTURE_TOWER});
    var towerSites = room.find(FIND_MY_CONSTRUCTION_SITES, {filter: (site) => site.structureType == STRUCTURE_TOWER});

    //how many towers are missing
    var missing = allowed - towers.length - towerSites.length;
    if(missing <= 0) {
        return;
    }

    //search for a free place with a small range first, then with a bigger range
    var positions = [];
    for(var r = 0; r < EXTENSION_SEARCH_RANGES.length; r++) {
        positions = getExtensionPositions(room, 1, EXTENSION_SEARCH_RANGES[r]);
        if(positions.length > 0) {
            break;
        }
    }

    //there is no free place, the tower has to be placed by hand
    if(positions.length == 0) {
        console.log('Construction: no free place for the tower in room ' + room.name + ', place it by hand');
        return;
    }

    //place the construction site
    var result = room.createConstructionSite(positions[0].x, positions[0].y, STRUCTURE_TOWER);
    if(result == OK) {
        console.log('Construction: placed tower site at ' + positions[0].x + '/' + positions[0].y + ' in room ' + room.name);
    } else {
        console.log('Construction: could not place tower at ' + positions[0].x + '/' + positions[0].y + ': ' + result);
    }
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

            //place containers next to the sources (before the extensions, because the extension part can end the loop early)
            placeContainers(room);

            //place towers
            placeTowers(room);

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