/**********************************************
*
* file: tasks.js
* date: 06.10.2026
* version: 0.1.0
*
* funtions: define tasks for creeps
*
**********************************************/

var tasks = {
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
    build: function(creep) {
        var result = creep.build(sites[0]);
        if(result == ERR_NOT_IN_RANGE) {
            creep.moveTo(sites[0], {visualizePathStyle: {stroke: '#ffffff'}});
            creep.say('To Site');
        } else if(result == OK) {
            creep.say('Building');
        } else {
            creep.say('Waiting');
        }
    },
    deliver: function(creep) {
        var targets = creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_EXTENSION ||
                        structure.structureType == STRUCTURE_SPAWN ||
                        structure.structureType == STRUCTURE_TOWER) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
        });
        if(targets.length > 0) {
            var result = creep.transfer(targets[0], RESOURCE_ENERGY);
            if(result == ERR_NOT_IN_RANGE) {
                creep.say('To Spawn');
                creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
            }else{
                creep.say('Transfer');
            }
        }else{
            creep.say('Idle');
        }
    }
};

module.exports = tasks;