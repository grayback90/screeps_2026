/**********************************************
*
* file: role.builder.js
* date: 05.10.2026
* version: 1.0.2
*
* funtions: builder harvests energy and builds construction sites
*           upgrades the controller if there is nothing to build
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
            // build, if there is nothing to build: upgrade the controller instead
            if(!tasks.build(creep)) {
                tasks.upgrade(creep);
            }
        } else {
            // harvest energy
            tasks.harvest(creep);
        }
    }
};
 
module.exports = roleBuilder;