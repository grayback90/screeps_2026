/**********************************************
*
* file: role.upgrader.js
* date: 06.10.2026
* version: 1.1.0
*
* funtions: upgrades the roomcontroller
*
**********************************************/
var tasks = require('tasks');

var roleUpgrader = {

    /** @param {Creep} creep **/
    run: function(creep) {

        // switch task: empty -> harvest, full -> upgrade
        tasks.switchTask(creep, 'upgrade');

        // run the current task
        tasks[creep.memory.task](creep);
    }
};

module.exports = roleUpgrader;