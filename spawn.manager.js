/**********************************************
*
* file: spawn.manager.js
* date: 02.10.2026
* version: 0.2
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

// bodies for creeps
var creepBodies = {
    harvester: [WORK, CARRY, MOVE],
    upgrader: [WORK, CARRY, MOVE],
    builder: [WORK, CARRY, MOVE]
};

var spawnManager = {

    run: function() {
       var spawn = Game.spawns['Spawn1'];
        
       //does the spawn exist?
         if(!spawn) {
            console.log('Spawn not found!');
            return;
         }

       //spawn busy?
       if(spawn.spawning) {
        console.log('Spawn is busy, spawning: ' + spawn.spawning.name);
        return;
       }

       var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
       var upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader');
       var builders = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder');

       var missingHarvesters = minCreeps.harvester - harvesters.length;
       var missingUpgraders = minCreeps.upgrader - upgraders.length;

       if(missingHarvesters > 0) {
        //harvesters are missing, spawn a new one
        var result = spawn.spawnCreep(creepBodies.harvester, 'Harvester' + Game.time, {memory: {role: 'harvester'}});
        console.log('Harvester missing, spawning a new one: ' + result);
        return;
       }

       if(missingUpgraders > 0) {
        //upgraders are missing, spawn a new one
        var result = spawn.spawnCreep(creepBodies.upgrader, 'Upgrader' + Game.time, {memory: {role: 'upgrader'}});
        console.log('Upgrader missing, spawning a new one: ' + result);
        return;
       }

       if(missingBuilders > 0) {
        //builders are missing, spawn a new one
        var result = spawn.spawnCreep(creepBodies.builder, 'Builder' + Game.time, {memory: {role: 'builder'}});
        console.log('Builder missing, spawning a new one: ' + result);
        return;
       }

       console.log('Harvesters: ' + harvesters.length + '/' + minCreeps.harvester + ', Upgraders: ' + upgraders.length + '/' + minCreeps.upgrader + ', Builders: ' + builders.length + '/' + minCreeps.builder);
    }
};

module.exports = spawnManager;