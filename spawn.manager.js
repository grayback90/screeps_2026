/**********************************************
*
* file: spawn.manager.js
*
* funtions: manage the spawning of creeps
*
**********************************************/

var intel = require('intel');

//constants
var LOG_INTERVAL = 20; //log interval in ticks
var DEFENDER_MARGIN = 1.5; //how much stronger than the enemy the creeps will be
var MAX_DEFENDERS = 5; //thats the maximum on defenders to spawn
var REPAIRS_UNDER_ATTACK = 3; //how many wallrepairer in an attack phase
var TICKRATE_SCOUTCHECK = 50; //the count in which a new calculation is done

//body patterns for creeps (gets repeated as often as energy allows)
var bodyPatterns = {
    //emergency body pattern (used when energy is low)
    emergencyBody: [WORK, CARRY, MOVE],
};

//helper function to calculate the minimum number of creeps of a certain role
function getMin(roleName, room) {
    var value = creepRoles[roleName].min;
    if(typeof value == 'function') {
        return value(room);
    }
    return value;
}

//helper function to decide the minimum on defenders needed
function defendersNeeded(room) {
    //defender body the room can pay
    var defenderBody = buildBody(creepRoles.defender.pattern, room.energyCapacityAvailable, creepRoles.defender.maxRepeats);
    //count the attack parts
    var partsPerDefender = _.filter(defenderBody, (part) => part == ATTACK).length;

    //protects that no division by 0 is done
    if(partsPerDefender == 0) {
        return 1;
    }

    //calculate the defenders needed
    var defendersCount = Math.ceil(room.memory.threat * DEFENDER_MARGIN / partsPerDefender);

    //return the count of defenders
    return Math.min(Math.max(1, defendersCount), MAX_DEFENDERS);
}

//helper function to decide the minimum on wallrepairers needed
function wallRepairersNeeded(room) {
    //if there are enemys the min is "REPAIRS_UNDER_ATTACK"
    if (room.memory.hostileCount > 0) {
        return REPAIRS_UNDER_ATTACK;
    } else {
        return 1;
    }
}

//helper function to check if there are hostile creeps in the room
function hostilesInTheRoom(room) {
    var hostiles = room.memory.hostileCount;
    if(hostiles > 0) {
        return hostiles;
    }
}

//helper function to check if there are tower in the room
function towersInTheRoom(room) {
    var towers = room.find(FIND_MY_STRUCTURES, {filter: (structure) => structure.structureType == STRUCTURE_TOWER});
    return towers.length > 0;
}

//helper funtion to check if there are walls or ramparts in the room
function wallOrRampartInTheRoom(room) {
    var wallsRamparts = room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            return (structure.structureType == STRUCTURE_WALL ||
                    structure.structureType == STRUCTURE_RAMPART);
        }});
    return wallsRamparts.length > 0;
}

//helper function to count sources with a container in the room
//returns the count
function sourcesWithContainer(room) {
    //get all the sources in the room
    var sources = room.find(FIND_SOURCES);
    var sourcesCount = 0;
    //count the sources with a container
    for(var i = 0; i < sources.length; i++) {
        //count sources with a container next to them
        var containers = sources[i].pos.findInRange(FIND_STRUCTURES, 1, {filter: (structure) => structure.structureType == STRUCTURE_CONTAINER});
        if(containers.length > 0) {
            sourcesCount ++;
        }
    }
    return sourcesCount;    
}

//helper function that counts hauler and miner and checks them with the count of container
//returns true if everthing is ok else it returns false
function economyRuns(room) {
    //checks how many hauler/miner are needed
    var needed = sourcesWithContainer(room);
    if(needed == 0) {
        return false;
    }

    //count miner and hauler
    var countMiner = _.filter(Game.creeps, (creep) => creep.memory.role == 'miner').length;
    var countHauler = _.filter(Game.creeps, (creep) => creep.memory.role == 'hauler').length;

    //checks the count of containers against the count of hauler/miner
    //if the condition is meet it returns true else it returns false
    return countMiner >= needed && countHauler >= needed;
}

//helper function to check if harvesters are needed
//returns how many harvesters are needed
function harvestersNeeded(room) {
    //if no container build then spawn 2 harvester
    //if there are container, then its checks the economy
    if(sourcesWithContainer(room) == 0) {
        return 2;
    } else if(economyRuns(room)) {
        return 0;
    } else {
        return 1;
    }
}

//helper function to check if a scout is needed
//returns how many scouts are needed
function scoutsNeeded(room) {
    //check only all if the ticks=TICKRATE_SCOUTCHECK
    if(!room.memory.scoutCheck || (Game.time - room.memory.scoutCheck >= TICKRATE_SCOUTCHECK)) {
        //simple test-object
        var target = intel.getScoutTarget({memory: {home: room.name}, room: room});
        room.memory.scoutsNeeded = target ? 1 : 0;
        room.memory.scoutCheck = Game.time;
    }
    //returns always 0 or a higher number if a scout is needed
    return room.memory.scoutsNeeded || 0;
}

//spawn queue
//priority of the roles (lower number = higher priority)
var creepRoles = {
    harvester: { min: harvestersNeeded, pattern: [WORK, CARRY, MOVE], maxRepeats: 3, priority: 1 },
    scout: { min: scoutsNeeded, pattern: [MOVE], maxRepeats: 1, priority: 1.5 },
    //condition to spawn defender: hostiles in the room > 0
    defender: { min: defendersNeeded, pattern: [ATTACK, MOVE], maxRepeats: 4, priority: 2, condition: hostilesInTheRoom },
    miner: { min: sourcesWithContainer, pattern: [WORK, WORK, MOVE], maxRepeats: 2, priority: 3 },
    hauler: { min: sourcesWithContainer, pattern: [CARRY, MOVE], maxRepeats: 6, priority: 4 },
    //condition to spawn towerFeeder: towers in the room > 0
    towerFeeder: { min: 1, pattern: [WORK, CARRY, MOVE], maxRepeats: 3, priority: 5, condition: towersInTheRoom },
    //condition to spawn wallRepairer: walls or ramparts in the room > 0
    wallRepairer: { min: wallRepairersNeeded, pattern: [WORK, CARRY, MOVE], maxRepeats: 3, priority: 6, condition: wallOrRampartInTheRoom },
    upgrader: { min: 1, pattern: [WORK, CARRY, MOVE], maxRepeats: 3, priority: 7 },
    builder: { min: 1, pattern: [WORK, CARRY, MOVE], maxRepeats: 3, priority: 8 }
};

//builds a body: repeats the pattern as often as energy and maxRepeats allow
function buildBody(pattern, energy, maxRepeats) {
    var cost = 0;
    for(var i = 0; i < pattern.length; i++) {
        cost += BODYPART_COST[pattern[i]];
    }
    var repeats = Math.min(Math.floor(energy / cost), maxRepeats);
    var body = [];
    for(var r = 0; r < repeats; r++) {
        body = body.concat(pattern);
    }
    return body;
}

//logs a message every LOG_INTERVAL ticks
function logEvery(message) {
    if(Game.time % LOG_INTERVAL == 0) {
        console.log(message);
    }
}

var spawnManager = {
 
    run: function() {
        var spawn = Game.spawns['Spawn1'];
        
        //does the spawn exist?
        if(!spawn) {
           logEvery('Spawn not found!');
           return;
        }

        //spawn busy
        if(spawn.spawning) {
            return;
        }
 
        //count the creeps of every role in creepRoles
        var counts = {};
        for(var countRole in creepRoles) {
            counts[countRole] = _.filter(Game.creeps, (creep) => creep.memory.role == countRole).length;
        }
    
        //max energy the room can hold (spawn + extensions)
        var energy = spawn.room.energyCapacityAvailable;
 
        //spawn queue: check for missing creeps in order of priority
        var queue = [];
        for(var role in creepRoles) {
            //check if the role is missing
            var missing = getMin(role, spawn.room) - counts[role];
            //check if the spawn condition is meet
            //only for roles that habe spawn condition, if not they will be added if the role is missing
            var condition = creepRoles[role].condition;
            var conditionMeet = !condition || condition(spawn.room);
            //if missing and spawn condition is meet, add to queue
            if(conditionMeet && missing > 0) {
                queue.push({role: role, priority: creepRoles[role].priority});
            }
        }

        //check if there are harvester, hauler or miner present
        var energySupplyAlive = counts.harvester > 0 || (counts.miner > 0 && counts.hauler > 0);
        //emergency spawn: if no harvesters or no hauler/miner are present, spawn an emergency harvester
        if(!energySupplyAlive) {
            queue.push({role: 'harvester', priority: 0, emergency: true});
        }

        //sort the queue by priority
        queue.sort(function(a, b) { return a.priority - b.priority; });

        //log the queue
        logEvery('Spawn queue: ' + JSON.stringify(queue));

        //working trough the queue and spawn creeps
        if (queue.length == 0) {
            //nothing to spawn
            //build the status text: one entry per role (current/minimum)
            var parts = [];
            for(var statusRole in creepRoles) {
                //skip roles whose spawn condition is not meet (they are not needed right now)
                var statusCondition = creepRoles[statusRole].condition;
                if(statusCondition && !statusCondition(spawn.room)) {
                    continue;
                }
                parts.push(statusRole + ': ' + counts[statusRole] + '/' + getMin(statusRole, spawn.room));
            }
            logEvery('Status: ' + parts.join(', '));
            return;
        } else {
            //get the first item in the queue
            var order = queue[0];
            if(order.emergency) {
                //spawn emergency harvester
                var body = buildBody(bodyPatterns.emergencyBody, energy, 1);
                var name = 'EmergencyHarvester' + Game.time;
                var result = spawn.spawnCreep(body, name, {memory: {role: order.role}});
                if(result == OK) {
                    console.log('COLD BOOT: Spawning emergency harvester (' + body.length + ' parts): ' + result);
                } else {
                    logEvery('COLD BOOT: Failed to spawn emergency harvester (' + body.length + ' parts): ' + result);
                }
                return;
            } else {
                //spawn normal creep
                var body = buildBody(creepRoles[order.role].pattern, energy, creepRoles[order.role].maxRepeats);
                var roleName = order.role.charAt(0).toUpperCase() + order.role.slice(1);
                var name = roleName + Game.time;
                var result = spawn.spawnCreep(body, name, {memory: {role: order.role}});
                if(result == OK) {
                    console.log(roleName + ' missing, spawning a new one (' + body.length + ' parts): ' + result);
                } else {
                    logEvery(roleName + ' missing, failed to spawn a new one (' + body.length + ' parts): ' + result);
                }
                return;
            }
        }
    }
};
 
module.exports = spawnManager;