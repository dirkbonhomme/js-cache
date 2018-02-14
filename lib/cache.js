var timeout = require('infinite-timeout');
var events = require('backbone-events-standalone');

/**
 * Find out if an object has a certain property
 *
 * @param {object} object
 * @param {string} key
 */
function has(object, key){
    return Object.prototype.hasOwnProperty.call(object, key);
}

/**
 * Cache class
 */
function Cache(){
    this.initialize.apply(this, arguments);
}
var _ = Cache.prototype;
events.mixin(_);

/**
 * Constructor
 *
 * @param {object} external Forward set, get, clear and del commands to an external handler (optional)
 */
_.initialize = function(external){
    this.store = {};
    this.external = external;
};

/**
 * Insert or overwrite data
 *
 * @param {string} key
 * @param {mixed} value
 * @param {number} ttl   Time to live in milliseconds (optional)
 */
_.set = function(key, value, ttl){
    if(typeof key === 'undefined') throw new Error('Required argument key is undefined');

    // Clear timeout on existing record
    var oldRecord = has(this.store, key)? this.store[key] : undefined;
    if(oldRecord && oldRecord.timeout){
        timeout.clear(oldRecord.timeout);
    }

    // Set value + timeout on new record
    var record = {value: value};
    if(typeof ttl === 'number'){
        record.timeout = timeout.set(this.delInternal.bind(this, key), ttl);
    }
    this.store[key] = record;

    // Call external handler
    if(this.external && typeof this.external.set === 'function'){
        this.external.set(key, value, ttl);
    }

    // Emit update/set events
    var action = oldRecord? 'update' : 'set';
    this.trigger(action, key, value, ttl);
    this.trigger(action + ':' + key, value, ttl);
};

/**
 * Get cached data
 *
 * @param {string} key
 * @param {function} callback  Return value in callback if records exists locally or on external resource (optional)
 * @return {mixed} value Only returned if callback is undefined
 */
_.get = function(key, callback){
    if(typeof key === 'undefined') throw new Error('Required argument key is undefined');
    if(has(this.store, key)){
        if(typeof callback === 'function'){
            process.nextTick(callback.bind(null, this.store[key].value));
        }else{
            return this.store[key].value;
        }
    }else if(typeof callback === 'function' && this.external && typeof this.external.get === 'function'){
        this.external.get(key, callback);
    }
};

/**
 * Delete cached data
 *
 * @param {string} key
 * @return {boolean} Returns true if record existed
 */
_.del = function(key){
    if(typeof key === 'undefined') throw new Error('Required argument key is undefined');
    if(this.external && typeof this.external.del === 'function'){
        this.external.del(key);
    }
    return this.delInternal(key);
};

_.delInternal = function(key){
    if(has(this.store, key)){

        // Clear timeout
        if(this.store[key].timeout){
            timeout.clear(this.store[key].timeout);
        }

        // Delete record
        delete this.store[key];

        // Emit del events
        this.trigger('del', key);
        this.trigger('del:' + key);
        return true;
    }else{
        return false;
    }
};

/**
 * Clear cached data
 *
 * @return {number} Returns number of cleared records
 */
_.clear = function(){
    var size = this.size();
    this.store = {};
    if(this.external && typeof this.external.clear === 'function'){
        this.external.clear();
    }
    this.trigger('clear', size);
    return size;
};

/**
 * Retrieve number of records
 *
 * @return {number}
 */
_.size = function(){
    var size = 0;
    for(var key in this.store){
        if(has(this.store, key)) size++;
    }
    return size;
};

/**
 * Retrieve internal store
 *
 * @return {object}
 */
_.debug = function(){
    return this.store;
};

/**
 * Retrieve list of keys
 *
 * @return {string[]}
 */
_.keys = function(){
    return Object.keys(this.store);
};


/**
 * Export a combined instance and constructor
 */
var instance = new Cache();
var constructor = function(){
    return new Cache(arguments[0]);
};
constructor.Cache = Cache;
for(var key in _){
    if(has(_, key) && typeof _[key] === 'function'){
        constructor[key] = _[key].bind(instance);
    }
}
module.exports = constructor;
