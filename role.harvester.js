/**********************************************
*
* file: role.harvester.js
* date: 01.10.2026
* version: 1.0.1
*
* funtions: harvest the source in the
*           spawn room and fills the
*           extensions and spawn
*
**********************************************/

var tasks = require('tasks');

var roleHarvester = {

    /** @param {Creep} creep **/
    run: function(creep) {
        if(creep.store.getFreeCapacity() > 0) {
            // harvest energy
            tasks.harvest(creep);
        }
        else {
            // deliver energy to spawn and extensions
            tasks.deliver(creep);
        }
    }
};

module.exports = roleHarvester;