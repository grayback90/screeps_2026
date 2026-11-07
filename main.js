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

//table for all roles
var roles = {harvester: roleHarvester, upgrader: roleUpgrader, builder: roleBuilder, towerFeeder: roleTowerFeeder, wallRepairer: roleWallRepairer,
            defender: roleDefender, miner: roleMiner, hauler: roleHauler, scout: roleScout, remoteMiner: roleRemoteMiner}

//table for all managers
var managers = [{name: 'defense', module: defense},
                {name: 'towerManager', module: towerManager},
                {name: 'constructionManager', module: constructionManager,},
                {name: 'spawnManager', module: spawnManager}]

//helper function that one error doesnt stop the whole code
function safeRun(name, fn) {
    try {
        return fn();
    } catch(error) {
        console.log('ERROR in ' + name + ': ' + error.stack);
    }
}

module.exports.loop = function () {

    //clear memory of dead creeps
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
        }
    }

    for(var i = 0; i < managers.length; i++) {
        safeRun(managers[i].name, function() {managers[i].run(); });
    }

    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        var role = roles[creep.memory.role];

        if(role) {
            try {
                role.run(creep);
            } catch(error) {
                console.log('Error in creep ' + name + ': ' + error.stack);
            }
        }
    }
}