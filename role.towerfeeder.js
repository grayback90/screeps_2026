/**********************************************
*
* file: role.towerfeeder.js
* date: 08.10.2026
* version: 0.1.0
*
* funtions: towerfeeder harvests energy and feeds it to the towers
*           upgrades the controller if there is nothing to feed
*
**********************************************/

var tasks = require('tasks');

var roleTowerFeeder = {
 
    /** @param {Creep} creep **/
    run: function(creep) {
 
        //switch task: empty -> harvest, full -> feedTower
        tasks.switchTask(creep, 'feedTower');
 
        if(creep.memory.task == 'feedTower') {
            //feed tower, if there is no tower to feed: upgrade the controller instead
            if(!tasks.feedTower(creep)){
                tasks.upgrade(creep);
            }
        } else {
            //harvest energy
            tasks.harvest(creep);
        }
    }
};
 
module.exports = roleTowerFeeder;