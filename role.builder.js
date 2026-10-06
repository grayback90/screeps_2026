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
                //upgrade controller
                tasks.upgrade(creep);
            }
 
            // build the first construction site found
            tasks.build(creep);
        } else {
            // harvest energy
            tasks.harvest(creep);
        }
    }
};
 
module.exports = roleBuilder;