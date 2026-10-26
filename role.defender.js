/**********************************************
*
* file: role.defender.js
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