/**********************************************
*
* file: remote.js
*
* funtions: chooses the remote room for the remote harvesting
*           returns the sources of the remote room
*
**********************************************/

var intel = require('intel');
var config = require('config');

var remote = {

    //returns the name of the remote room (a safe neighbour room with sources) or null if there is none
    //the choice is saved in the room memory and checked again every config.REMOTE_CHECK_INTERVAL ticks
    getRemoteRoom: function(room) {

        //checked recently: return the saved result (it can be null, that means there was no room)
        if(room.memory.remoteCheck && Game.time - room.memory.remoteCheck < config.REMOTE_CHECK_INTERVAL) {
            return room.memory.remoteRoom;
        }

        //all neighbour rooms that are good for remote harvesting
        var candidates = intel.getRemoteRooms(room.name);

        //keep the old room as long as it is still a good room
        var oldRoom = room.memory.remoteRoom || null;
        var chosen = null;
        if(oldRoom && candidates.indexOf(oldRoom) >= 0) {
            chosen = oldRoom;
        }

        //no old room, choose the candidate with the most sources
        //bestSources starts at 0, so every candidate with sources is better
        if(!chosen) {
            var bestSources = 0;
            for(var i = 0; i < candidates.length; i++) {
                var sources = Memory.rooms[candidates[i]].scout.sources;
                if(sources > bestSources) {
                    chosen = candidates[i];
                    bestSources = sources;
                }
            }
        }

        //tell it only when the remote room has changed
        if(chosen != oldRoom) {
            if(chosen) {
                console.log('Remote: room ' + chosen + ' chosen for ' + room.name);
            } else {
                console.log('Remote: no room available for ' + room.name);
            }
        }

        //save the result and the time of the check
        room.memory.remoteRoom = chosen;
        room.memory.remoteCheck = Game.time;
        return chosen;
    },

    //returns the sources of the remote room from the scout data (list of {id, x, y}), or an empty list
    getRemoteSources: function(room) {
        var name = remote.getRemoteRoom(room);
        if(!name) {
            return [];
        }
        return Memory.rooms[name].scout.sourceList;
    }
};

module.exports = remote;