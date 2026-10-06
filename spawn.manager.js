/**********************************************
*
* file: spawn.manager.js
* date: 02.10.2026
* version: 0.5.0
*
* funtions: manage the spawning of creeps
*
**********************************************/

// creep count
var minCreeps = {
    harvester: 2, 
    upgrader: 1,
    builder: 1
};
 
// body patterns for creeps (gets repeated as often as energy allows)
var bodyPatterns = {
    // emergency body pattern (used when energy is low)
    emergencyBody: [WORK, CARRY, MOVE],
    // normal body patterns
    harvester: [WORK, CARRY, MOVE],
    upgrader: [WORK, CARRY, MOVE],
    builder: [WORK, CARRY, MOVE]
};

// max repeats of the pattern per role (3time per body part)
var maxRepeats = {
    harvester: 3,
    upgrader: 3,
    builder: 3
};

// spawn queue
// priority of the roles (lower number = higher priority)
var creepRoles = {
    harvester: { min: 2, pattern: [WORK, CARRY, MOVE], maxRepeats: 3, priority: 1 },
    upgrader: { min: 1, pattern: [WORK, CARRY, MOVE], maxRepeats: 3, priority: 2 },
    builder: { min: 1, pattern: [WORK, CARRY, MOVE], maxRepeats: 3, priority: 3 }
};

// builds a body: repeats the pattern as often as energy and maxRepeats allow
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

// log interval in ticks
var LOG_INTERVAL = 20;

// logs a message every LOG_INTERVAL ticks
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
 
        var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
        var upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader');
        var builders = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder');
    
        var missingHarvesters = minCreeps.harvester - harvesters.length;
        var missingUpgraders = minCreeps.upgrader - upgraders.length;
        var missingBuilders = minCreeps.builder - builders.length;
    
        //max energy the room can hold (spawn + extensions)
        var energy = spawn.room.energyCapacityAvailable;
 
        //spawn queue: check for missing creeps in order of priority
        var queue = [];
        for(var role in creepRoles) {
            //check if the role is missing
            var missing = creepRoles[role].min - _.filter(Game.creeps, (creep) => creep.memory.role == role).length;
            //if missing, add to queue
            if(missing > 0) {
                queue.push({role: role, priority: creepRoles[role].priority});
            }
        }

        //emergency spawn: if no harvesters are present, spawn an emergency harvester
        if(harvesters.length == 0) {
            queue.push({role: 'harvester', priority: 0, emergency: true});
        }

        //sort the queue by priority
        queue.sort(function(a, b) { return a.priority - b.priority; });

        //log the queue
        logEvery('Spawn queue: ' + JSON.stringify(queue));

        if(missingHarvesters > 0) {
            //harvesters are missing, spawn a new one
            if(harvesters.length == 0) {
                // no harvesters at all, spawn emergency harvester
                var body = buildBody(bodyPatterns.emergencyBody, energy, 1);
                var result = spawn.spawnCreep(body, 'EmergencyHarvester' + Game.time, {memory: {role: 'harvester'}});
                if(result == OK) {
                    console.log('COLD BOOT: Spawning emergency harvester (' + body.length + ' parts): ' + result);
                }        
            } else {
                var body = buildBody(bodyPatterns.harvester, energy, maxRepeats.harvester);
                var result = spawn.spawnCreep(body, 'Harvester' + Game.time, {memory: {role: 'harvester'}});
                if(result == OK) {
                    console.log('Harvester missing, spawning a new one (' + body.length + ' parts): ' + result);
                }
            }
            return;
        }
 
        if(missingUpgraders > 0) {
            //upgraders are missing, spawn a new one
            var body = buildBody(bodyPatterns.upgrader, energy, maxRepeats.upgrader);
            var result = spawn.spawnCreep(body, 'Upgrader' + Game.time, {memory: {role: 'upgrader'}});
            if(result == OK) {
                console.log('Upgrader missing, spawning a new one (' + body.length + ' parts): ' + result);
            }
            return;
        }
 
        if(missingBuilders > 0) {
            //builders are missing, spawn a new one
            var body = buildBody(bodyPatterns.builder, energy, maxRepeats.builder);
            var result = spawn.spawnCreep(body, 'Builder' + Game.time, {memory: {role: 'builder'}});
            if(result == OK) {
                console.log('Builder missing, spawning a new one (' + body.length + ' parts): ' + result);
            }
            return;
        }
 
       logEvery('Harvesters: ' + harvesters.length + '/' + minCreeps.harvester + ', Upgraders: ' + upgraders.length + '/' + minCreeps.upgrader + ', Builders: ' + builders.length + '/' + minCreeps.builder);
    }
};
 
module.exports = spawnManager;