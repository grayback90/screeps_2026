/**********************************************
*
* file: role.miner.js
* date: 23.10.2026
* version: 0.0.1
*
* funtions: sits on a container near a source and mines it
*
**********************************************/

var tasks = require('tasks');

var roleMiner = {
 
    /** @param {Creep} creep **/
    run: function(creep) {
        tasks.mine(creep);
    }
};
 
module.exports = roleMiner;