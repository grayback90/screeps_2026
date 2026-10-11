/**********************************************
*
* file: role.defender.js
* date: 11.10.2026
* version: 0.0.1
*
* funtions: defends the spawn/room
*
**********************************************/

var tasks = require('tasks');

var roleDefender = {

    /** @param {Creep} creep **/
    run: function(creep) {

        //defend and if there is nothing to defend then rest
        if(!tasks.defend(creep)) {
            tasks.rest(creep);
        }

    }
};

module.exports = roleDefender;