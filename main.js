/**********************************************
*
* file: main.js
* date: 02.10.2026
* version: 1.2.0
*
* funtions: main logic
*
**********************************************/

// import modules
var spawnManager = require('spawn.manager');
var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var defense = require('defense');
var towerManager = require('tower.manager');

module.exports.loop = function () {

    //clear memory of dead creeps
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
        }
    }

    //run defense logic
    defense.run();

    //run tower manager
    towerManager.run();

    //run spawn manager
    spawnManager.run();

    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        if(creep.memory.role == 'harvester') {
            roleHarvester.run(creep);
        }
        if(creep.memory.role == 'upgrader') {
            roleUpgrader.run(creep);
        }
        if(creep.memory.role == 'builder') {
            roleBuilder.run(creep);
        }
    }
}