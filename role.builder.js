/**********************************************
*
* file: role.builder.js
* date: 05.10.2026
* version: 1.0.1
*
* funtions: builder harvests energy and builds construction sites
*
**********************************************/

var tasks = require('tasks');

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
            //search for construction sites
            var sites = creep.room.find(FIND_CONSTRUCTION_SITES);
            // if no construction sites are found, upgrade the controller instead
            if(sites.length == 0) {
                var result = creep.upgradeController(creep.room.controller);
            
                if(result == ERR_NOT_IN_RANGE) {
                    creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffffff'}});
                    creep.say('To Ctrl');
                } else if(result == OK) {
                    creep.say('Upgrading');
                } else {
                    creep.say('Waiting');
                }
                return;
            }
 
            // build the first construction site found
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
            // harvest energy
            tasks.harvest(creep);
        }
    }
};
 
module.exports = roleBuilder;