/**********************************************
*
* file: tasks.js
* date: 06.10.2026
* version: 0.3.0
*
* funtions: define tasks for creeps
*
**********************************************/

var tasks = {
    //switches between harvest and the work task of a role (empty -> harvest, full -> work)
    switchTask: function(creep, workTask) {
        if(!creep.memory.task) {
            creep.memory.task = 'harvest';
        }
        if(creep.memory.task == workTask && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.task = 'harvest';
        }
        if(creep.memory.task != workTask && creep.store.getFreeCapacity() == 0) {
            creep.memory.task = workTask;
        }
    },
    //harvests the first source in the room
    harvest: function(creep) {
        var sources = creep.room.find(FIND_SOURCES);
        var result = creep.harvest(sources[0]);
        if(result == ERR_NOT_IN_RANGE) {
            creep.moveTo(sources[0], {visualizePathStyle: {stroke: '#ffaa00'}});
            creep.say('To Source');
        } else if (result == OK) {
            creep.say('Harvesting');
        } else {
            creep.say('Waiting');
        }
    },
    //upgrades the roomcontroller
    upgrade: function(creep) {
        var result = creep.upgradeController(creep.room.controller);
        if(result == ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffffff'}});
            creep.say('To Ctrl');
        } else if(result == OK) {
            creep.say('Upgrading');
        } else {
            creep.say('Waiting');
        }
    },
    //builds the first construction site, returns false if there is nothing to build
    build: function(creep) {
        var sites = creep.room.find(FIND_CONSTRUCTION_SITES);
        if(sites.length == 0) {
            return false;
        }
        var result = creep.build(sites[0]);
        if(result == ERR_NOT_IN_RANGE) {
            creep.moveTo(sites[0], {visualizePathStyle: {stroke: '#ffffff'}});
            creep.say('To Site');
        } else if(result == OK) {
            creep.say('Building');
        } else {
            creep.say('Waiting');
        }
        return true;
    },
    //delivers energy to the first spawn or extension that is not full, returns false if there is nothing to deliver to
    deliver: function(creep) {
        var targets = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_EXTENSION ||
                        structure.structureType == STRUCTURE_SPAWN ||
                        structure.structureType == STRUCTURE_TOWER) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
        });
        if(targets.length == 0) {
            creep.say('Idle');
            return false;
        }
        var result = creep.transfer(targets[0], RESOURCE_ENERGY);
        if(result == ERR_NOT_IN_RANGE) {
            creep.say('To Spawn');
            creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
        } else {
            creep.say('Transfer');
        }
        return true;
    }
};

module.exports = tasks;