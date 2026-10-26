/**********************************************
*
* file: role.hauler.js
*
* funtions: gets the energy from a container to the spawn
*
**********************************************/

var tasks = require('tasks');

var roleHauler = {
 
    /** @param {Creep} creep **/
    run: function(creep) {
        //switch task: empty -> fetch, full -> deliver
        tasks.switchTask(creep, 'deliver', 'fetch');

        if(creep.memory.task == 'fetch') {
            //there is nothing to fetch
            if(!tasks.fetch(creep)) {
                //has the creep energy in its own storage
                if(creep.store[RESOURCE_ENERGY] > 0) {
                    tasks.deliver(creep);
                } else {
                    creep.say('Waiting');
                }
            }
        } else {
            //deliver the energy
            tasks.deliver(creep);
        }
    }
};
 
module.exports = roleHauler;