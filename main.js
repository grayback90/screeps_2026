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
var roleRemoteMiner = require('role.remoteminer');
var defense = require('defense');
var towerManager = require('tower.manager');
var constructionManager = require('construction.manager');

//helper function that one error doesnt stop the whole code
function safeRun(name, fn) {
    try {
        return fn();
    } catch(error) {
        console.log(name);
        error.stack;
    }
}

module.exports.loop = function () {

    //clear memory of dead creeps
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
        }
    }

    //run defense logic
    safeRun('defense', function() { defense.run(); });

    //run tower manager
    safeRun('towerManager', function() { towerManager.run(); });

    //run construction logic
    safeRun('constructionManager', function() { constructionManager.run(); });

    //run spawn manager
    safeRun('spawnManager', function() { spawnManager.run(); });

    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        if(creep.memory.role == 'harvester') {
            try {
                roleHarvester.run(creep);
            } catch(error) {
                console.log(name);
                error.stack;
            }
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
        if(creep.memory.role == 'remoteMiner') {
            roleRemoteMiner.run(creep);
        }
    }
}