/**********************************************
*
* file: role.builder.js
* date: 05.10.2026
* version: 0.1
*
* funtions: builder harvests energy and builds construction sites
*
**********************************************/
 
var roleBuilder = {
 
    /** @param {Creep} creep **/
    run: function(creep) {
 
        // switch state: empty -> harvest, full -> build
        if(creep.memory.building && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.building = false;
        }
        if(!creep.memory.building && creep.store.getFreeCapacity() == 0) {
            creep.memory.building = true;
        }
 
        if(creep.memory.building) {
            // build
            var sites = creep.room.find(FIND_CONSTRUCTION_SITES);
 
            if(sites.length == 0) {
                creep.say('No Sites');
                return;
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
        } else {
            // harvest
            var sources = creep.room.find(FIND_SOURCES);
            var result = creep.harvest(sources[0]);
 
            if(result == ERR_NOT_IN_RANGE) {
                creep.moveTo(sources[0], {visualizePathStyle: {stroke: '#ffaa00'}});
                creep.say('To Source');
            } else if(result == OK) {
                creep.say('Harvesting');
            } else {
                creep.say('Waiting');
            }
        }
    }
};
 
module.exports = roleBuilder;