/**********************************************
*
* file: defense.js
* date: 07.10.2026
* version: 1.0.0
*
* funtions: detect threats and threat-level in the rooms
*           saves the number of hostile creeps in the room memory
*           enables safe mode if needed
*
**********************************************/

//constants
var SAFE_MODE_SPAWN_HITS = 0.6; //under 60% of the spawn hitpoints there is an alarm
var SAFE_MODE_ENABLED = false; //false = no safe mode, just a log message / true = safe mode will be activated if needed

//helper function that activates the safe mode if a spawn loses hitpoints while enemies are in the room
function checkSafeMode(room) {
     //no enemies in the room, nothing to do
    if(!room.memory.hostileCount) {
        return;
    }
 
    var controller = room.controller;
    //safe mode can not be activated: it is running, in cooldown or no charge is left
    if(controller.safeMode || controller.safeModeCooldown || controller.safeModeAvailable < 1) {
        return;
    }
 
    //check all spawns of the room
    var spawns = room.find(FIND_MY_SPAWNS);
    for(var i = 0; i < spawns.length; i++) {
         //the spawn has lost too many hitpoints -> alarm
        if(spawns[i].hits < spawns[i].hitsMax * SAFE_MODE_SPAWN_HITS) {
            var message = 'SAFE MODE: spawn in room ' + room.name + ' has ' + spawns[i].hits + ' hitpoints';
 
            if(SAFE_MODE_ENABLED) {
                //really activate the safe mode
                var result = controller.activateSafeMode();
                console.log(message + ', activated: ' + result);
            } else {
                //test mode: only log
                console.log(message + ', would activate');
            }
            //activate only once
            return;
        }
    }
}


var defense = {

    run: function() {

        //go through all rooms we can see
        for(var roomName in Game.rooms) {
            var room = Game.rooms[roomName];

            // skip rooms that are not ours
            if(!room.controller || !room.controller.my) {
                continue;
            }

            //find all hostile creeps in the room
            var hostiles = room.find(FIND_HOSTILE_CREEPS);

            //calculate the threat-level of the attack
            //attack and ranged attack + 1 and heal + 2 
            var threat = 0;
            for(var i = 0; i < hostiles.length; i++) {
                threat = threat + hostiles[i].getActiveBodyparts(ATTACK);
                threat = threat + hostiles[i].getActiveBodyparts(RANGED_ATTACK);
                threat = threat + (hostiles[i].getActiveBodyparts(HEAL) * 2);
            }
            room.memory.threat = threat;

            //safeMode
            checkSafeMode(room);

            //read the old count before we overwrite it
            var oldCount = room.memory.hostileCount || 0;

            //save the new count in the room memory
            room.memory.hostileCount = hostiles.length;

            //log only when the situation changes
            if(oldCount == 0 && hostiles.length > 0) {
                console.log('ALERT: ' + hostiles.length + ' hostile creep(s) in room ' + roomName + ' Threat-Level: ' + threat);
            }
            if(oldCount > 0 && hostiles.length == 0) {
                console.log('All clear: no more hostile creeps in room ' + roomName);
            }
        }
    }
};

module.exports = defense;