/**********************************************
*
* file: tasks.js
*
* funtions: define tasks for creeps
*
**********************************************/

//imports
var intel = require('intel');
var remote = require('remote');
var config = require('config');

//returns the source a creep should harvest from
//reuses the source from the creep's memory, otherwise picks the source with the fewest creeps
function getSource(creep) {
    //try to get the source that is saved in the creep's memory
    var source = Game.getObjectById(creep.memory.sourceId);
    //the creep already has a source, use it
    if(source) {
        return source;
    }

    //no source in memory yet, get all sources of the room
    var sources = creep.room.find(FIND_SOURCES);
    //there is no source in this room, nothing to harvest
    if(sources.length == 0) {
        return null;
    }

    //best = source with the fewest creeps so far
    //bestCount starts very high, so the first source is always better
    var best = null;
    var bestCount = Infinity;
    //check every source in the room
    for(var i = 0; i < sources.length; i++) {
        //count how many creeps already harvest from this source
        var count = _.filter(Game.creeps, (c) => c.memory.sourceId == sources[i].id).length;
        //fewer creeps than the best source so far -> this is the new best
        if(count < bestCount) {
            best = sources[i];
            bestCount = count;
        }
    }
    //save the chosen source in the creep's memory for the next ticks
    creep.memory.sourceId = best.id;
    //return the chosen source
    return best;
}

//returns the construction site a creep should build
//reuses the site from the creep's memory, otherwise picks the closest site
function getSite(creep) {
    //try to get the site that is saved in the creep's memory
    var site = Game.getObjectById(creep.memory.siteId);
    //the creep already has a site, use it
    if(site) {
        return site;
    }

    //no site in memory (or it is finished), find the closest site
    var closest = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
    //there is no construction site in this room, nothing to build
    if(!closest) {
        return null;
    }

    //save the chosen site in the creep's memory for the next ticks
    creep.memory.siteId = closest.id;
    //return the chosen site
    return closest;
}

//returns the target a creep should deliver energy to
//reuses the target from the creep's memory, otherwise picks the closest spawn, tower or extension that is not full
function getDeliverTarget(creep) {
    //try to reuse the extension from the creep's memory
    var deliverTarget = Game.getObjectById(creep.memory.deliverTargetId);

    //reuse the extension as long as it is not full
    if(deliverTarget &&
       deliverTarget.structureType == STRUCTURE_EXTENSION &&
       deliverTarget.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
        return deliverTarget;
    }

    //find all extensions that are not full
    var extensions = creep.room.find(FIND_MY_STRUCTURES, {
        filter: (structure) => {
            return structure.structureType == STRUCTURE_EXTENSION &&
                   structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        }
    });

    //if there are extensions that need energy, choose the closest one
    if(extensions.length > 0) {
        var closestExtension = creep.pos.findClosestByRange(extensions);
        creep.memory.deliverTargetId = closestExtension.id;
        return closestExtension;
    }

    //all extensions are full, now look for a spawn that is not full
    var spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS, {
        filter: (structure) => {
            return structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        }
    });

    //there is a spawn that needs energy
    if(spawn) {
        creep.memory.deliverTargetId = spawn.id;
        return spawn;
    }

    //there is nothing to deliver to
    delete creep.memory.deliverTargetId;
    return null;
}

//returns a tower that a creep should feed with energy
//reuses the tower from the creep's memory, otherwise picks the closest tower that is not full
function getTowerFeedTarget(creep) {
    //try to get the tower that is saved in the creep's memory
    var towerTarget = Game.getObjectById(creep.memory.towerFeedTargetId);
    //the creep already has a tower, use it if it is not full
    if(towerTarget && towerTarget.store[RESOURCE_ENERGY] < towerTarget.store.getCapacity(RESOURCE_ENERGY) * config.TOWER_FILL_LIMIT) {
        //return the tower from memory
        return towerTarget;
    }

    //no tower in memory (or it is full), find the tower with the lowest energy that is not full
    var towers = creep.room.find(FIND_MY_STRUCTURES, {
        filter: (structure) => structure.structureType == STRUCTURE_TOWER && structure.store[RESOURCE_ENERGY] < structure.store.getCapacity(RESOURCE_ENERGY) * config.TOWER_FILL_LIMIT
    });
    //there is no tower that needs to be filled
    if(towers.length == 0) {
        return null;
    }

    //save the tower with lowest energy in memory
    //bestTower = tower with the lowest energy so far
    //bestEnergy starts very high, so the first tower with lower energy is always better
    var bestTower = null;
    var bestEnergy = Infinity;
    //check every tower in the room
    for(var i = 0; i < towers.length; i++) {
        //checks the energy of every tower in the room
        var energy = towers[i].store[RESOURCE_ENERGY];
        //fewer energy than the lowest energy so far -> this is the new bestEnergy
        if(energy < bestEnergy) {
            bestTower = towers[i];
            bestEnergy = energy;
        }
    }
    //save the chosen tower in the creep's memory for the next ticks
    creep.memory.towerFeedTargetId = bestTower.id;
    //return the chosen tower
    return bestTower;
}

//returns the hitpoints for walls and ramparts
//get the RCL (RoomControllerLevel) and checks the hitpoints of a wall or rampart
function getWallTarget(room) {
    var rcl = room.controller.level;
    return config.WALL_HITPOINTS_BY_LEVEL[rcl] || 0;
}

//returns the wall or rampart a creep should repair
//normal: the one with the lowest hitpoints under the limit (remembered in the creep's memory)
//under attack: the one with the lowest hitpoints near an enemy (chosen again every tick)
function getRepairTarget(creep) {
    //get the hitpoints limit of the current room the creep is in
    var limit = getWallTarget(creep.room);
    //is the room under attack?
    var underAttack = creep.room.memory.hostileCount > 0;
 
    //not under attack: try to get the target that is saved in the creep's memory
    //under attack the situation changes every tick, so the creep chooses again
    if(!underAttack) {
        var targetToRepair = Game.getObjectById(creep.memory.targetToRepairId);
        //is there a target in the memory and the hitpoints are lower than the limit, use it
        if(targetToRepair && targetToRepair.hits < limit) {
            return targetToRepair;
        }
    }
 
    //find all walls and ramparts with hitpoints under the limit
    var repairTargets = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            return (structure.structureType == STRUCTURE_WALL ||
                    structure.structureType == STRUCTURE_RAMPART) &&
                    structure.hits < limit;
        }
    });
    //there is nothing to repair
    if(repairTargets.length == 0) {
        return null;
    }
 
    //under attack: prefer the walls and ramparts that are near an enemy
    if(underAttack) {
        var hostiles = creep.room.find(FIND_HOSTILE_CREEPS);
        //keep only the targets that are within config.ATTACK_ZONE_RANGE of at least one enemy
        var threatened = _.filter(repairTargets, (structure) => {
            return _.some(hostiles, (hostile) => structure.pos.getRangeTo(hostile) <= config.ATTACK_ZONE_RANGE);
        });
        //if there are threatened targets, only look at them, otherwise keep the full list
        if(threatened.length > 0) {
            repairTargets = threatened;
        }
    }
 
    //bestTargetToRepair = repair target with lowest hitpoints so far
    //bestHitpoints starts very high, so the first repair target is always better
    var bestTargetToRepair = null;
    var bestHitpoints = Infinity;
    //check every repair target
    for(var i = 0; i < repairTargets.length; i++) {
        var hitpoints = repairTargets[i].hits;
        //fewer hitpoints than the lowest so far -> this is the new best
        if(hitpoints < bestHitpoints) {
            bestTargetToRepair = repairTargets[i];
            bestHitpoints = hitpoints;
        }
    }
    //save the chosen repair target in the creep's memory for the next ticks
    creep.memory.targetToRepairId = bestTargetToRepair.id;
    //return the chosen repair target
    return bestTargetToRepair;
}

//returns the free rampart that is closest to the enemy, or null if there is none
function getDefensePost(creep, hostile) {
    // get all ramparts of our room
    var ramparts = creep.room.find(FIND_MY_STRUCTURES, {
        filter: (structure) => structure.structureType == STRUCTURE_RAMPART
    });
    // keep only ramparts where nobody else stands (the creep itself is fine)
    var freeRamparts = _.filter(ramparts, (rampart) => {
        var creepsOnTile = rampart.pos.lookFor(LOOK_CREEPS);
        return creepsOnTile.length == 0 || creepsOnTile[0].id == creep.id;
    });

    // there is no free rampart in the room
    if(freeRamparts.length == 0) {
        return null;
    }

    // return the free rampart that is closest to the enemy
    return hostile.pos.findClosestByRange(freeRamparts);
}

//returns true if the creep can collect energy of the floor
//else it returns false
function collectEnergy(creep) {
    //search for dropped energy, tombstones and ruins where the energy is like or over the minimum energy that we will pickup
    var droppedEnergy = creep.room.find(FIND_DROPPED_RESOURCES, {filter: (resource) => resource.resourceType == RESOURCE_ENERGY && resource.amount >= config.PICKUP_MIN_ENERGY});
    var tombstoneEnergy = creep.room.find(FIND_TOMBSTONES, {filter: (tombstone) => tombstone.store[RESOURCE_ENERGY] >= config.PICKUP_MIN_ENERGY});
    var ruinsEnergy = creep.room.find(FIND_RUINS, {filter: (ruin) => ruin.store[RESOURCE_ENERGY] >= config.PICKUP_MIN_ENERGY});
    //combine the three lists
    var energyOnTheFloor = droppedEnergy.concat(tombstoneEnergy, ruinsEnergy);

    //no energy to pickup
    if(energyOnTheFloor.length == 0) {
        return false;
    }

    //the closest energy on the floor for a creep
    var closestEnergyOnTheFloor = creep.pos.findClosestByRange(energyOnTheFloor);
    //check if find resource is on the floor or in a tombstone/ruin
    if(closestEnergyOnTheFloor.amount !== undefined) {
        var result = creep.pickup(closestEnergyOnTheFloor);
    } else {
        var result = creep.withdraw(closestEnergyOnTheFloor, RESOURCE_ENERGY);
    }

    //move to the energy pile if not in range
    if(result == ERR_NOT_IN_RANGE) {
        moveToTarget(creep, closestEnergyOnTheFloor, {visualizePathStyle: {stroke: '#ffaa00'}});
        creep.say('To Pile');
    } else if (result == OK) {
        creep.say('Pickup');
    } else {
        creep.say('Waiting');
    }

    return true;
}

//returns the source a miner works at: a source with a container next to it and no other miner
//reuses the source from the creep's memory
function getMinerSource(creep) {
    //try to get the source that is saved in the creep's memory
    var source = Game.getObjectById(creep.memory.minerSourceId);
    //the miner already has a source, use it
    if(source) {
        return source;
    }
 
    //no source in memory yet, check all sources of the room
    var sources = creep.room.find(FIND_SOURCES);
    for(var i = 0; i < sources.length; i++) {
 
        //skip sources without a container next to them
        var containers = sources[i].pos.findInRange(FIND_STRUCTURES, 1, {filter: (structure) => structure.structureType == STRUCTURE_CONTAINER});
        if(containers.length == 0) {
            continue;
        }
 
        //skip sources where another miner already works
        var miners = _.filter(Game.creeps, (c) => c.memory.role == 'miner' && c.memory.minerSourceId == sources[i].id);
        if(miners.length > 0) {
            continue;
        }
 
        //free source with a container found, save it in the creep's memory for the next ticks
        creep.memory.minerSourceId = sources[i].id;
        return sources[i];
    }
 
    //there is no free source with a container
    return null;
}

//returns the container next to a source that a hauler should fetch energy from
//reuses the container from the creep's memory, otherwise picks the container with the most energy
function getFetchTarget(creep) {
    //try to get the container that is saved in the creep's memory
    var container = Game.getObjectById(creep.memory.fetchTargetId);
    //the container still has enough energy, use it
    if(container && container.store[RESOURCE_ENERGY] >= config.FETCH_MIN_ENERGY) {
        return container;
    }
 
    //find all containers next to a source that have enough energy
    var containers = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            return structure.structureType == STRUCTURE_CONTAINER &&
                    structure.store[RESOURCE_ENERGY] >= config.FETCH_MIN_ENERGY &&
                    structure.pos.findInRange(FIND_SOURCES, 1).length > 0;
        }
    });
    //there is no container with enough energy
    if(containers.length == 0) {
        return null;
    }
 
    //best = container with the most energy so far
    var best = null;
    var bestEnergy = 0;
    //check every container
    for(var i = 0; i < containers.length; i++) {
        var energy = containers[i].store[RESOURCE_ENERGY];
        //more energy than the best so far -> this is the new best
        if(energy > bestEnergy) {
            best = containers[i];
            bestEnergy = energy;
        }
    }
 
    //save the chosen container in the creep's memory for the next ticks
    creep.memory.fetchTargetId = best.id;
    //return the chosen container
    return best;
}

//return the container that is overflowing and nearest to the creep
function getSupplyTarget(creep) {
    //get the container from memory
    var container = Game.getObjectById(creep.memory.gatherTargetId);
    //if there is no container in memory
    if(container && container.store[RESOURCE_ENERGY] >= config.FETCH_MIN_ENERGY) {
        return container;
    }

    //find all containers that overflow with energy
    var containers = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            return structure.structureType == STRUCTURE_CONTAINER &&
                    structure.store[RESOURCE_ENERGY] >= config.CONTAINER_SURPLUS;
        }
    });

    //there is no container or not overflowing
    if(containers.length == 0) {
        return null;
    }

    //choose the closest that match the condition
    var closestContainer = creep.pos.findClosestByRange(containers);
    //save it to the memory
    creep.memory.gatherTargetId = closestContainer.id;

    return closestContainer;

}

//returns the moveTo function with special options
function moveToTarget(creep, target, options) {
    //if options are not set, get a empty object
    options = options || {};
    //set the standard values if they are not set
    if(options.reusePath === undefined) {
        options.reusePath = config.REUSE_PATH;
    }
    //draw the path only in debug mode (needs more CPU)
    if(config.DEBUG_PATHS) {
        //check if format is set, if not set it to standard
        if(!options.visualizePathStyle) {
            options.visualizePathStyle = {stroke: '#ffffff'}; 
        }
    } else {
        delete options.visualizePathStyle;
    }
    return creep.moveTo(target, options);
}

//returns an entry {id, x, y} of a source or null
function getRemoteSourceEntry(creep, home) {
    // Get all remote sources for the home room
    var entries = remote.getRemoteSources(home);

    // Check if the creep already has a remote source assigned
    if (creep.memory.remoteSourceId) {
        var assignedEntry = _.find(entries, (entry) => {
            return entry.id == creep.memory.remoteSourceId;
        });

        if (assignedEntry) {
            return assignedEntry;
        }
    }

    // Find an unoccupied remote source
    for (var entry of entries) {
        // Count remote miners assigned to this source
        var assignedCreeps = _.filter(Game.creeps, (creeps) => {
            return creeps.memory.role == 'remoteMiner' && creeps.memory.remoteSourceId == entry.id;
        });

        // Assign the source if no remote miner is using it
        if (assignedCreeps.length == 0) {
            creep.memory.remoteSourceId = entry.id;
            return entry;
        }
    }

    // No free remote source available
    return null;
}

//return the best position for a remote container or null if there is none
function getRemoteContainerPosition(source, homeName) {
    //get the room
    var room = source.room;

    //search for the exit to the home room
    var exitDirection = room.findExitTo(homeName);
    if(exitDirection < 0) {
        return null;
    }

    //all fields of the exit
    var exitTiles = room.find(exitDirection);
    if(exitTiles.length = 0) {
        return null;
    }

    //field that is the nearest to the source
    var exitPos = source.pos.findClosestByRange(exitTiles);
    //get the terrain
    var terrain = room.getTerrain();

    //find the best field
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
            var distance = exitPos.getRangeTo(x, y);
            if(distance < bestDistance) {
                best = {x: x, y: y};
                bestDistance = distance;
            }
        }
    }

    return best;
}

//set the construction site for a remote container if there is none
function manageRemoteContainer(creep, source) {
    var room = creep.room;

    //search for containers next to the source
    var containers = source.pos.findInRange(FIND_STRUCTURES, 1, {
        filter: (structure) => {
            return structure.structureType == STRUCTURE_CONTAINER;
        }
    });

    //search for container construction sites next to the source
    var sites = source.pos.findInRange(FIND_CONSTRUCTION_SITES, 1, {
        filter: (site) => {
            return site.structureType == STRUCTURE_CONTAINER;
        }
    });

    //create a container construction site if neither exists
    if(containers.length == 0 && sites.length == 0) {
        var pos = getRemoteContainerPosition(source, creep.memory.home);

        if(pos) {
            var result = room.createConstructionSite(
                pos.x,
                pos.y,
                STRUCTURE_CONTAINER
            );

            if(result == OK) {
                console.log('[Remote] Container construction site created at ' +
                    pos.x + ',' + pos.y + ' in ' + room.name);
            } else {
                console.log('[Remote] Failed to create container construction site: ' +
                    result + ' in ' + room.name);
            }
        }
    }

    //count all containers in the room
    room.memory.remoteContainers = room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            return structure.structureType == STRUCTURE_CONTAINER;
        }
    }).length;

    //count all owned construction sites in the room
    room.memory.remoteSites = room.find(FIND_MY_CONSTRUCTION_SITES).length;
}

var tasks = {
    //switches between the fetch task and the work task of a role (empty -> fetch, full -> work)
    //fetchTask is optional, the default is harvest
    switchTask: function(creep, workTask, fetchTask) {
        //if fetchTask is not set, then it is the 'harvest'-task
        fetchTask = fetchTask || 'harvest';
        
        if(!creep.memory.task) {
            creep.memory.task = fetchTask;
        }
        if(creep.memory.task == workTask && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.task = fetchTask;
        }
        if(creep.memory.task != workTask && creep.store.getFreeCapacity() == 0) {
            creep.memory.task = workTask;
        }
    },
    //harvests the source with the fewest creeps harvesting from it
    harvest: function(creep) {
        //check if there is energy on the ground or in a ruin/tombstone
        if(collectEnergy(creep)) {
            return;
        }

        //else just harvest normal
        var source = getSource(creep);
        if(!source) {
            creep.say('No Source');
            return;
        }
        var result = creep.harvest(source);
        if(result == ERR_NOT_IN_RANGE) {
            moveToTarget(creep, source, {visualizePathStyle: {stroke: '#ffaa00'}});
            creep.say('To Source');
        } else if (result == OK) {
            creep.say('Harvesting');
        } else {
            creep.say('Waiting');
        }
    },
    //upgrades the roomcontroller
    upgrade: function(creep) {
        var result = creep.upgradeController(creep.room.controller);
        if(result == ERR_NOT_IN_RANGE) {
            moveToTarget(creep, creep.room.controller, {visualizePathStyle: {stroke: '#ffffff'}});
            creep.say('To Ctrl');
        } else if(result == OK) {
            creep.say('Upgrading');
        } else {
            creep.say('Waiting');
        }
    },
    //builds the closest construction site, returns false if there is nothing to build
    build: function(creep) {
        var site = getSite(creep);
        if(!site) {
            return false;
        }
        var result = creep.build(site);
        if(result == ERR_NOT_IN_RANGE) {
            moveToTarget(creep, site, {visualizePathStyle: {stroke: '#ffffff'}});
            creep.say('To Site');
        } else if(result == OK) {
            creep.say('Building');
        } else {
            creep.say('Waiting');
        }
        return true;
    },
    //delivers energy to the closest spawn or extension that is not full, returns false if there is nothing to deliver to
    deliver: function(creep) {
        var target = getDeliverTarget(creep);
        if(!target) {
            creep.say('Idle');
            return false;
        }
        var result = creep.transfer(target, RESOURCE_ENERGY);
        if(result == ERR_NOT_IN_RANGE) {
            creep.say('To Spawn');
            moveToTarget(creep, target, {visualizePathStyle: {stroke: '#ffffff'}});
        } else {
            creep.say('Transfer');
        }
        return true;
    },
    //feed the towers if they need to be feed
    //function returns false if all towers are full
    feedTower: function(creep) {
        //get target to feed
        var target = getTowerFeedTarget(creep);
        //there is no target to feed
        if(!target) {
            return false;
        }

        //feed the tower
        var result = creep.transfer(target, RESOURCE_ENERGY);
        if(result == ERR_NOT_IN_RANGE) {
            creep.say('To Tower');
            moveToTarget(creep, target, {visualizePathStyle: {stroke: '#ffffff'}});
        } else {
            creep.say('Feeding');
        }
        return true;
    },
    //repairs the wall or rampart with the lowest hitpoints
    //function returns false if there is nothing to repair
    repair: function(creep) {
        //get target to repair
        var target = getRepairTarget(creep);
        //there is no target to repair
        if(!target){
            return false;
        }

        //repair the target
        var result = creep.repair(target);
        if(result == ERR_NOT_IN_RANGE) {
            creep.say('To Wall');
            //repair range is 3, so this saves movement
            moveToTarget(creep, target, {range: 3, visualizePathStyle: {stroke: '#ffffff'}});
        } else {
            creep.say('Repairing');
        }
        return true;
    },
    //attacks the enemy
    //function returns false if there is no enemy
    defend: function(creep) {
        //search for the next enemy
        var target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        //there is no enemy
        if(!target) {
            return false;
        }

        //if there is at least one enemy -> attack
        var result = creep.attack(target);
        //get the ramp nearest to the position of the enemy
        var post = getDefensePost(creep, target);
        //is there a ramp
        if(post) {
            //if the creep doesnt sit on it he moves to it;
            if(!creep.pos.isEqualTo(post)) {
                creep.say('To Ramp');
                moveToTarget(creep, post, {reusePath: 2});
            } else {
                //if he sits on the ramp he hold it against the enemy
                creep.say('Hold Ramp');
            }
        } else {
            //if there is no ramp (not build or destroyed)
            //defender moves to the enemy and attacks directly
            if(result == ERR_NOT_IN_RANGE) {
                creep.say('To Enemy');
                moveToTarget(creep, target);
            } else {
                creep.say('Attack');
            }
        }
        return true;
    },
    //creep goes to rest if there is no enemy and guards the spawn
    rest: function(creep) {
        //search the next owned spawn
        var spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS);
        //there is no spawn
        if(!spawn) {
            return;
        }

        //is the creep more than 3 spaces away
        if(creep.pos.getRangeTo(spawn) > 3) {
            //move to the spawn
            creep.say('To Spawn');
            moveToTarget(creep, spawn, {range: 3});
        } else {
            creep.say('Guard');
        }
    },
    //miner stands on the container next to its source and harvests (the energy falls into the container)    
    mine: function(creep) {
        //get the source of the miner
        var source = getMinerSource(creep);
        //there is no free source with a container
        if(!source) {
            creep.say('No Post');
            return;
        }
 
        //find the container next to the source
        var containers = source.pos.findInRange(FIND_STRUCTURES, 1, {filter: (structure) => structure.structureType == STRUCTURE_CONTAINER});
        if(containers.length == 0) {
            //the container is gone
            creep.say('No Cont');
            return;
        }
        var container = containers[0];
 
        //the miner has to stand on the container before he harvests, otherwise the energy falls to the ground
        if(!creep.pos.isEqualTo(container.pos)) {
            creep.say('To Post');
            moveToTarget(creep, container.pos, {visualizePathStyle: {stroke: '#ffaa00'}});
            return;
        }
 
        //harvest the source
        var result = creep.harvest(source);
        if(result == OK) {
            creep.say('Mining');
        } else {
            //for example the source is empty and regenerates
            creep.say('Waiting');
        }
    },
    //hauler takes energy out of a container next to a source, returns false if no container has enough energy
    fetch: function(creep) {
        //get the container to fetch from
        var target = getFetchTarget(creep);
        //there is no container with enough energy
        if(!target) {
            return false;
        }
 
        //take the energy out of the container
        var result = creep.withdraw(target, RESOURCE_ENERGY);
        if(result == ERR_NOT_IN_RANGE) {
            creep.say('To Cont');
            moveToTarget(creep, target, {visualizePathStyle: {stroke: '#ffaa00'}});
        } else {
            creep.say('Loading');
        }
        return true;
    },
    //gather energy from the ground -> container -> harvest yourself from the source
    gather: function(creep) {
        //checks if there is energy on the floor
        if(collectEnergy(creep)) {
            return;
        }
        //get the target to gather from
        var target = getSupplyTarget(creep);
        //if there is no target then go and harvest yourself (fallback)
        if(!target) {
            tasks.harvest(creep);
            return;
        }

        //withdraw energy from the container
        var result = creep.withdraw(target, RESOURCE_ENERGY);

        if(result == ERR_NOT_IN_RANGE) {
            creep.say('To Cont');
            moveToTarget(creep, target, {visualizePathStyle: {stroke: '#ffaa00'}});
        } else {
            creep.say('Taking');
        }
        return;
    },
    scout: function(creep) {
        //remember home
        if(!creep.memory.home) {
            creep.memory.home = creep.room.name;
        }

        //data of the current room
        var data = creep.room.memory.scout;
        //if there is no data or data is older than config.SCOUT_RECORD_INTERVAL ticks
        if(!data || (Game.time - data.time > config.SCOUT_RECORD_INTERVAL)) {
            intel.recordRoom(creep.room);
        }

        //check the target (if there is no target or the scout stands in the target room)
        var scoutTarget = creep.memory.scoutTarget;
        if(!scoutTarget || creep.room.name == scoutTarget) {
            scoutTarget = intel.getScoutTarget(creep);
            creep.memory.scoutTarget = scoutTarget;
        }

        //is the target 'null' then go home else go scouting
        if(scoutTarget == null) {
            creep.say('Done');
            moveToTarget(creep, new RoomPosition(25, 25, creep.memory.home), {range: 20});
        } else {
            moveToTarget(creep, new RoomPosition(25, 25, scoutTarget), {range: 20, visualizePathStyle: {stroke: '#00ffff'}});
            creep.say('Scouting');
        }
        return;
    },
    remoteMine: function(creep) {
        //save the home room if he has none
        if(!creep.memory.home) {
            creep.memory.home = creep.room.name;
        }

        //home room as object
        var home = Game.rooms[creep.memory.home];

        //just to secure there is a home
        if(!home) {
            creep.say('No Home');
            return;
        }

        //remote room
        var remoteRoom = remote.getRemoteRoom(home);
        if(!remoteRoom) {
            creep.say('No Room');
            return;
        }

        //get the source in the remote room
        var remoteSource = getRemoteSourceEntry(creep, home);
        if(!remoteSource) {
            creep.say('No Post');
            return;
        }

        //walking to the remote source
        if(creep.room.name != remoteRoom) {
            moveToTarget(creep, new RoomPosition(remoteSource.x, remoteSource.y, remoteRoom), {range: 1});
            creep.say('To Remote');
            return;
        }

        //mining
        var source = Game.getObjectById(remoteSource.id);
        //if the id is not resolvable delete the memory and try later again
        if(!source) {
            delete creep.memory.remoteSourceId;
            creep.say('No Source');
            return;
        }

        //build container construction site if there is none
        if(Game.time % config.REMOTE_SITE_INTERVAL == 0) {
            manageRemoteContainer(creep, source);
        }

        var result = creep.harvest(source);

        //mining, walking or waiting
        if(result == ERR_NOT_IN_RANGE) {
            moveToTarget(creep, source);
            creep.say('To Source');
        } else if(result == OK) {
            creep.say('Mining');
        } else {
            creep.say('Waiting');
        }
    }
};

module.exports = tasks;