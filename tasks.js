/**********************************************
*
* file: tasks.js
* date: 06.10.2026
* version: 1.0.0
*
* funtions: define tasks for creeps
*
**********************************************/

//returns the source a creep should harvest from
//reuses the source from the creep's memory, otherwise picks the source with the fewest creeps
function getSource(creep) {
    //try to get the source that is saved in the creep's memory
    var source = Game.getObjectById(creep.memory.sourceId);
    //the creep already has a source, use it
    if(source) {
        return source;
    }

    //no source in memory yet, get all sources of the room
    var sources = creep.room.find(FIND_SOURCES);
    //there is no source in this room, nothing to harvest
    if(sources.length == 0) {
        return null;
    }

    //best = source with the fewest creeps so far
    //bestCount starts very high, so the first source is always better
    var best = null;
    var bestCount = Infinity;
    //check every source in the room
    for(var i = 0; i < sources.length; i++) {
        //count how many creeps already harvest from this source
        var count = _.filter(Game.creeps, (c) => c.memory.sourceId == sources[i].id).length;
        //fewer creeps than the best source so far -> this is the new best
        if(count < bestCount) {
            best = sources[i];
            bestCount = count;
        }
    }
    //save the chosen source in the creep's memory for the next ticks
    creep.memory.sourceId = best.id;
    //return the chosen source
    return best;
}

//returns the construction site a creep should build
//reuses the site from the creep's memory, otherwise picks the closest site
function getSite(creep) {
    //try to get the site that is saved in the creep's memory
    var site = Game.getObjectById(creep.memory.siteId);
    //the creep already has a site, use it
    if(site) {
        return site;
    }

    //no site in memory (or it is finished), find the closest site
    var closest = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);
    //there is no construction site in this room, nothing to build
    if(!closest) {
        return null;
    }

    //save the chosen site in the creep's memory for the next ticks
    creep.memory.siteId = closest.id;
    //return the chosen site
    return closest;
}

//returns the target a creep should deliver energy to
//reuses the target from the creep's memory, otherwise picks the closest spawn or extension that is not full
function getDeliverTarget(creep) {
    //try to get the target that is saved in the creep's memory
    var deliverTarget = Game.getObjectById(creep.memory.deliverTargetId);
    //the creep already has a target, use it if it is not full
    if(deliverTarget && deliverTarget.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
        //return the target from memory
        return deliverTarget;
    }

    //no target in memory (or it is full), find the closest spawn or extension that is not full
    var targets = creep.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: (structure) => {
            return (structure.structureType == STRUCTURE_EXTENSION ||
                    structure.structureType == STRUCTURE_SPAWN ||
                    structure.structureType == STRUCTURE_TOWER) &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        }
    });

    //there is no spawn or extension that is not full, nothing to deliver to
    if (!targets) {
        return null;
    } else {
        //save the chosen target in the creep's memory for the next ticks
        creep.memory.deliverTargetId = targets.id;
    }
    //return the chosen target
    return targets;
}

var tasks = {
    //switches between harvest and the work task of a role (empty -> harvest, full -> work)
    switchTask: function(creep, workTask) {
        if(!creep.memory.task) {
            creep.memory.task = 'harvest';
        }
        if(creep.memory.task == workTask && creep.store[RESOURCE_ENERGY] == 0) {
            creep.memory.task = 'harvest';
        }
        if(creep.memory.task != workTask && creep.store.getFreeCapacity() == 0) {
            creep.memory.task = workTask;
        }
    },
    //harvests the source with the fewest creeps harvesting from it
    harvest: function(creep) {
        var source = getSource(creep);
        if(!source) {
            creep.say('No Source');
            return;
        }
        var result = creep.harvest(source);
        if(result == ERR_NOT_IN_RANGE) {
            creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
            creep.say('To Source');
        } else if (result == OK) {
            creep.say('Harvesting');
        } else {
            creep.say('Waiting');
        }
    },
    //upgrades the roomcontroller
    upgrade: function(creep) {
        var result = creep.upgradeController(creep.room.controller);
        if(result == ERR_NOT_IN_RANGE) {
            creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffffff'}});
            creep.say('To Ctrl');
        } else if(result == OK) {
            creep.say('Upgrading');
        } else {
            creep.say('Waiting');
        }
    },
    //builds the closest construction site, returns false if there is nothing to build
    build: function(creep) {
        var site = getSite(creep);
        if(!site) {
            return false;
        }
        var result = creep.build(site);
        if(result == ERR_NOT_IN_RANGE) {
            creep.moveTo(site, {visualizePathStyle: {stroke: '#ffffff'}});
            creep.say('To Site');
        } else if(result == OK) {
            creep.say('Building');
        } else {
            creep.say('Waiting');
        }
        return true;
    },
    //delivers energy to the closest spawn or extension that is not full, returns false if there is nothing to deliver to
    deliver: function(creep) {
        var target = getDeliverTarget(creep);
        if(!target) {
            creep.say('Idle');
            return false;
        }
        var result = creep.transfer(target, RESOURCE_ENERGY);
        if(result == ERR_NOT_IN_RANGE) {
            creep.say('To Spawn');
            creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
        } else {
            creep.say('Transfer');
        }
        return true;
    }
};

module.exports = tasks;