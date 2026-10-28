/**********************************************
*
* file: main.js
*
* funtions: main logic
*
**********************************************/

// import modules
var spawnManager = require('spawn.manager');
var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleTowerFeeder = require('role.towerfeeder');
var roleWallRepairer = require('role.wallrepairer');
var roleDefender = require('role.defender');
var roleMiner = require('role.miner');
var roleHauler = require('role.hauler');
var roleScout = require('role.scout');
var defense = require('defense');
var towerManager = require('tower.manager');
var constructionManager = require('construction.manager');

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

    //run construction logic
    constructionManager.run();

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
        if(creep.memory.role == 'towerFeeder') {
            roleTowerFeeder.run(creep);
        }
        if(creep.memory.role == 'wallRepairer') {
            roleWallRepairer.run(creep);
        }
        if(creep.memory.role == 'defender') {
            roleDefender.run(creep);
        }
        if(creep.memory.role == 'miner') {
            roleMiner.run(creep);
        }
        if(creep.memory.role == 'hauler') {
            roleHauler.run(creep);
        }
        if(creep.memory.role == 'scout') {
            roleScout.run(creep);
        }
    }
}