/**********************************************
*
* file: spawn.manager.js
* date: 09.10.2026
* version: 1.4.0
*
* funtions: manage the spawning of creeps
*
**********************************************/

//constants
//log interval in ticks
var LOG_INTERVAL = 20;

//body patterns for creeps (gets repeated as often as energy allows)
var bodyPatterns = {
    //emergency body pattern (used when energy is low)
    emergencyBody: [WORK, CARRY, MOVE],
};

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

//spawn queue
//priority of the roles (lower number = higher priority)
var creepRoles = {
    harvester: { min: 2, pattern: [WORK, CARRY, MOVE], maxRepeats: 3, priority: 1 },
    //condition to spawn towerFeeder: towers in the room > 0
    towerFeeder: { min: 1, pattern: [WORK, CARRY, MOVE], maxRepeats: 3, priority: 2, condition: towersInTheRoom },
    //condition to spawn wallRepairer: walls or ramparts in the room > 0
    wallRepairer: { min: 1, pattern: [WORK, CARRY, MOVE], maxRepeats: 3, priority: 3, condition: wallOrRampartInTheRoom },
    upgrader: { min: 1, pattern: [WORK, CARRY, MOVE], maxRepeats: 3, priority: 4 },
    builder: { min: 1, pattern: [WORK, CARRY, MOVE], maxRepeats: 3, priority: 5 }
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
            var missing = creepRoles[role].min - counts[role];
            //check if the spawn condition is meet
            //only for roles that habe spawn condition, if not they will be added if the role is missing
            var condition = creepRoles[role].condition;
            var conditionMeet = !condition || condition(spawn.room);
            //if missing and spawn condition is meet, add to queue
            if(conditionMeet && missing > 0) {
                queue.push({role: role, priority: creepRoles[role].priority});
            }
        }

        //emergency spawn: if no harvesters are present, spawn an emergency harvester
        if(counts.harvester == 0) {
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
                parts.push(statusRole + ': ' + counts[statusRole] + '/' + creepRoles[statusRole].min);
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