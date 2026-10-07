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
        tasks.switchTask(creep, 'build');
 
        if(cpreep.memory.task == 'build') {
            //build, if there is nothing to build: upgrade the controller instead
            if(!tasks.build(creep)) {
                tasks.upgrade(creep);
            }
        } else {
            //harvest energy
            tasks.harvest(creep);
        }
    }
};
 
module.exports = roleBuilder;