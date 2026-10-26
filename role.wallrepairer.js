/**********************************************
*
* file: role.wallrepairer.js
*
* funtions: wallrepairer harvests energy and repairs walls and ramparts
*           upgrades the controller if there is nothing to repair
*
**********************************************/

var tasks = require('tasks');

var roleWallRepairer = {
 
    /** @param {Creep} creep **/
    run: function(creep) {
 
        //switch task: empty -> gather, full -> repair
        tasks.switchTask(creep, 'repair', 'gather');
 
        if(creep.memory.task == 'repair') {
            //repair, if there is nothing to repair: upgrade the controller instead
            if(!tasks.repair(creep)){
                tasks.upgrade(creep);
            }
        } else {
            //harvest energy
            tasks.harvest(creep);
        }
    }
};
 
module.exports = roleWallRepairer;