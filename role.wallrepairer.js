/**********************************************
*
* file: role.wallrepairer.js
* date: 09.10.2026
* version: 0.1.0
*
* funtions: wallrepairer harvests energy and repairs walls and ramparts
*           upgrades the controller if there is nothing to repair
*
**********************************************/

var tasks = require('tasks');

var roleWallRepairer = {
 
    /** @param {Creep} creep **/
    run: function(creep) {
 
        // switch task: empty -> harvest, full -> repair
        tasks.switchTask(creep, 'repair');
 
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