/**********************************************
*
* file: role.builder.js
*
* funtions: builder harvests energy and builds construction sites
*           upgrades the controller if there is nothing to build
*
**********************************************/

var tasks = require('tasks');

var roleBuilder = {
 
    /** @param {Creep} creep **/
    run: function(creep) {
 
        //switch task: empty -> gather, full -> build
        tasks.switchTask(creep, 'build', 'gather');
 
        if(creep.memory.task == 'build') {
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