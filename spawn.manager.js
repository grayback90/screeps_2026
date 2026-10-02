/**********************************************
*
* file: spawn.manager.js
* date: 02.10.2026
* version: 0.1
*
* funtions: manage the spawning of creeps
*
**********************************************/

// creep count
var minCreeps = {
    harvester: 2,
    upgrader: 1
};

var spawnManager = {

    run: function() {
       var spawn = Game.spawns['Spawn1'];
       var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
       var upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader');

       var missingHarvesters = minCreeps.harvester - harvesters.length;
       var missingUpgraders = minCreeps.upgrader - upgraders.length;

       if(missingHarvesters > 0) {
        //harvesters are missing, spawn a new one
        console.log('Harvester missing, spawning a new one');
        return;
       }

       if(missingUpgraders > 0) {
        //upgraders are missing, spawn a new one
        console.log('Upgrader missing, spawning a new one');
        return;
       }

       console.log('Harvesters: ' + harvesters.length + '/' + minCreeps.harvester + ', Upgraders: ' + upgraders.length + '/' + minCreeps.upgrader);
    }
};

module.exports = spawnManager;