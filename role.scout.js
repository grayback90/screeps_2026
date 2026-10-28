/**********************************************
*
* file: role.scout.js
*
* funtions: scouts the rooms next to his home
*
**********************************************/

var tasks = require('tasks');

var roleScout = {
 
    /** @param {Creep} creep **/
    run: function(creep) {
        tasks.scout(creep);
    }
};
 
module.exports = roleScout;