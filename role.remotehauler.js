/**********************************************
*
* file: role.remotehauler.js
*
* funtions: fetch the energy in remote rooms
*
**********************************************/

var tasks = require('tasks');

var roleRemoteHauler = {

    /** @param {Creep} creep **/
    run: function(creep) {
        tasks.remoteHaul(creep);
    }
};

module.exports = roleRemoteHauler;