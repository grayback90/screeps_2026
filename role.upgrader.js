/**********************************************
*
* file: role.upgrader.js
*
* funtions: upgrades the roomcontroller
*
**********************************************/
var tasks = require('tasks');

var roleUpgrader = {

    /** @param {Creep} creep **/
    run: function(creep) {

        //switch task: empty -> gather, full -> upgrade
        tasks.switchTask(creep, 'upgrade', 'gather');

        //run the current task
        tasks[creep.memory.task](creep);
    }
};

module.exports = roleUpgrader;