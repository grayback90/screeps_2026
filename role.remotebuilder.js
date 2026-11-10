/**********************************************
*
* file: role.remotebuilder.js
*
* funtions: builder gathers energy and builds construction sites
*           in remote rooms or home room
*           upgrades the controller if there is nothing to build
*
**********************************************/

var tasks = require('tasks');

var roleRemoteBuilder = {
 
    /** @param {Creep} creep **/
    run: function(creep) { 
        tasks.remoteBuild(creep);
    }
};
 
module.exports = roleRemoteBuilder;