/**********************************************
*
* file: role.upgrader.js
* date: 01.10.2026
* version: 1.0.1
*
* funtions: upgrades the roomcontroller
*
**********************************************/
var tasks = require('tasks');

var roleUpgrader = {

    /** @param {Creep} creep **/
    run: function(creep) {

        if(creep.memory.upgrading && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.upgrading = false;
        }
        if(!creep.memory.upgrading && creep.store.getFreeCapacity() == 0) {
            creep.memory.upgrading = true;
        }

        if(creep.memory.upgrading) {
            //upgrade controller
            tasks.upgrade(creep);
        } else {
            //harvest energy
            tasks.harvest(creep);
        }
    }
};

module.exports = roleUpgrader;