/**********************************************
*
* file: tasks.js
* date: 06.10.2026
* version: 0.1.0
*
* funtions: define tasks for creeps
*
**********************************************/

var tasks = {
    harvest: function(creep) {
        var sources = creep.room.find(FIND_SOURCES);
        var result = creep.harvest(sources[0]);
        if(result == ERR_NOT_IN_RANGE) {
            creep.moveTo(sources[0], {visualizePathStyle: {stroke: '#ffaa00'}});
            creep.say('To Source');
        } else if (result == OK) {
            creep.say('Harvesting');
        } else {
            creep.say('Waiting');
        }
    },
    upgrade: function(creep) {},
    build: function(creep) {},
    deliver: function(creep) {}
};

module.exports = tasks;