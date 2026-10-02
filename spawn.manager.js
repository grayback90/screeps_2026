/**********************************************
*
* file: spawn.manager.js
* date: 02.10.2026
* version: 0.1
*
* funtions: manage the spawning of creeps
*
**********************************************/

var spawnManager = {

    run: function() {
       var spawn = Game.spawns['Spawn1'];
       var harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
       var upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader');

       console.log('Harvesters: ' + harvesters.length + ', Upgraders: ' + upgraders.length);
    }
};

module.exports = spawnManager;