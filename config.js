/**********************************************
*
* file: config.js
*
* funtions: file for all constants and switches
*           to modify the code for anyone
*
**********************************************/

var config = {
    /* gameplay-switches */
    REMOTE_HARVESTING_ENABLED: false, //if true then remote miner and hauler are spawned if there are sources in free rooms
    DEBUG_PATHS: false, //disable/enable the visualisation of the path (false uses less CPU)
    SAFE_MODE_ENABLED: false, //false = no safe mode, just a log message / true = safe mode will be activated if needed
    
    /* roles */
    MAX_UPGRADERS: 5, //maximum number of upgraders
    MAX_BUILDERS: 3, //maximum of builders in the room
    MAX_DEFENDERS: 5, //thats the maximum on defenders to spawn

    /* creep movement */
    REUSE_PATH: 20, //creep calculates new path in this amount of ticks (standard is 5)

    /* energy and scaling */
    PICKUP_MIN_ENERGY: 50, //energy in the floor below this cap will not be collected
    FETCH_MIN_ENERGY: 50, //a hauler only fetches from containers with at least this much energy
    CONTAINER_SURPLUS: 500, //if a container has more than this threshold it counts as overflowing

    /* upgrading */
    UPGRADER_STOCK_STEP: 1000, //for this much energy in the containers one more upgrader is needed

    /* building */
    SITES_PER_BUILDER: 2, //every amount of this variable one builder is spawned
    EXTENSION_SEARCH_RANGES: [6, 8, 10], //how far from the spawn the extensions are placed (in tiles), the next range is used if there are not enough free tiles
    CONSTRUCTION_INTERVAL: 50, //the manager checks every x ticks if something has to be built
    MAX_CONSTRUCTION_SITES: 5, //max number of construction sites in a room at the same time

    /* defending */
    DEFENDER_MARGIN: 1.5, //how much stronger than the enemy the creeps will be
    REPAIRS_UNDER_ATTACK: 3, //how many wallrepairer in an attack phase
    TOWER_FEEDER_UNDER_ATTACK: 1, //how many tower feeder in an attack phase
    REPAIR_RESERVE: 0.6, //the tower will only repair if he has more than 60% energy
    TOWER_FILL_LIMIT: 0.9, //tower is full if he has more than 90% energy, then he can be fed by a creep
    WALL_HITPOINTS_BY_LEVEL: {1: 0, 2: 10000, 3: 30000, 4: 100000, 5: 300000, 6: 1000000, 7: 3000000, 8: 10000000}, //target hitpoints for walls and ramparts by controller level
    ATTACK_ZONE_RANGE: 3, //if a wall is in this range of an hostile creep, it counts as attacked

    /* scouting */
    TICKRATE_SCOUTCHECK: 50, //the count in which a new calculation is done
    MAX_SCOUT_RANGE: 2, //how many rooms the scout goes away from the home room
    SCOUT_STALE: 10000, //after how many ticks a room is visited again
    REMOTE_CHECK_INTERVAL: 100, //the remote room is checked again every x ticks
    SCOUT_RECORD_INTERVAL: 100, //the scout records the room it stands in again after this many ticks

    /* defense */
    SAFE_MODE_SPAWN_HITS: 0.6, //under x (0,6 = 60%) of the spawn hitpoints there is an alarm

    /* logging */
    LOG_INTERVAL: 20, //log interval in ticks
};

module.exports = config;

