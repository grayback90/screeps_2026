/**********************************************
*
* file: role.miner.js
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