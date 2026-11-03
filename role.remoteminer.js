/**********************************************
*
* file: role.remoteminer.js
*
* funtions: mines the source in remote rooms
*
**********************************************/

var tasks = require('tasks');

var roleRemoteMiner = {

    /** @param {Creep} creep **/
    run: function(creep) {
        tasks.remoteMine(creep);
    }
};

module.exports = roleRemoteMiner;