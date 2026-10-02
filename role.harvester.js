/**********************************************
*
* file: role.harvester.js
* date: 01.10.2026
* version: 0.2
*
* funtions: harvest the source in the
*           spawn room and fills the
*           extensions and spawn
*
**********************************************/

var roleHarvester = {

    /** @param {Creep} creep **/
    run: function(creep) {
        if(creep.store.getFreeCapacity() > 0) {
            var sources = creep.room.find(FIND_SOURCES);
            var result = creep.harvest(sources[0]);
            if(result == ERR_NOT_IN_RANGE) {
                creep.say('To Source');
                creep.moveTo(sources[0], {visualizePathStyle: {stroke: '#ffaa00'}});
            } else if (result == OK) {
                creep.say('Harvest');
            }else{
                creep.say('Waiting');
            }
        }
        else {
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
    }
};

module.exports = roleHarvester;