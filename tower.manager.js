/**********************************************
*
* file: tower.manager.js
* date: 07.10.2026
* version: 0.2.0
*
* funtions: manage towers in the rooms
*           handles tower actions like attacking hostiles and repairing structures
*
**********************************************/

// constants
// the tower will only repair if he has more than 60% energy
var REPAIR_RESERVE = 0.6;

var towerManager = {

    run: function() {
        //go through all rooms we can see
        for(var roomName in Game.rooms) {
            var room = Game.rooms[roomName];

            // skip rooms that are not ours
            if(!room.controller || !room.controller.my) {
                continue;
            }

            //find all towers in the room
            var towers = room.find(FIND_MY_STRUCTURES, {
                filter: (structure) => structure.structureType == STRUCTURE_TOWER
            });

            //go through all towers in the room
            for(var i in towers) {
                var tower = towers[i];

                //skip tower if it has less than 10 energy
                if(tower.store[RESOURCE_ENERGY] < 10) {
                    continue;
                }

                //find closest hostile creep and attack it
                var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
                if(closestHostile) {
                    tower.attack(closestHostile);
                    continue;
                }

                //heal closest friendly
                var closestFriendly = tower.pos.findClosestByRange(FIND_MY_CREEPS, {
                    filter: (friendly) => friendly.hits < friendly.hitsMax
                });
                tower.heal(closestFriendly);
                continue;

                //repair closest structure (road or container) if it is damaged
                //only repair if tower has more than 60% energy
                if(tower.store[RESOURCE_ENERGY] > tower.store.getCapacity(RESOURCE_ENERGY) * REPAIR_RESERVE) {
                    var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
                        filter: (structure) => structure.hits < structure.hitsMax && (structure.structureType == STRUCTURE_ROAD || structure.structureType == STRUCTURE_CONTAINER)
                    });
                    if(closestDamagedStructure) {
                        tower.repair(closestDamagedStructure);
                    }
                }

            }
        }
    }

};

module.exports = towerManager;