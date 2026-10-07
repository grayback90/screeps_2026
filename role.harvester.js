/**********************************************
*
* file: role.harvester.js
* date: 01.10.2026
* version: 1.1.0
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
        
        //switch task: empty -> harvest, full -> deliver
        tasks.switchTask(creep, 'deliver');
        
        //execute the task defined in creep.memory.task
        tasks[creep.memory.task](creep);
    }
};

module.exports = roleHarvester;