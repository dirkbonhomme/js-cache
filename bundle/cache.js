!function(e){"object"==typeof exports?module.exports=e():"function"==typeof define&&define.amd?define(e):"undefined"!=typeof window?window.cache=e():"undefined"!=typeof global?global.cache=e():"undefined"!=typeof self&&(self.cache=e())}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require('./lib/cache');
},{"./lib/cache":2}],2:[function(require,module,exports){
var process=require("__browserify_process");var timeout = require('infinite-timeout');
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

},{"__browserify_process":7,"backbone-events-standalone":4,"infinite-timeout":5}],3:[function(require,module,exports){
/**
 * Standalone extraction of Backbone.Events, no external dependency required.
 * Degrades nicely when Backone/underscore are already available in the current
 * global context.
 *
 * Note that docs suggest to use underscore's `_.extend()` method to add Events
 * support to some given object. A `mixin()` method has been added to the Events
 * prototype to avoid using underscore for that sole purpose:
 *
 *     var myEventEmitter = BackboneEvents.mixin({});
 *
 * Or for a function constructor:
 *
 *     function MyConstructor(){}
 *     MyConstructor.prototype.foo = function(){}
 *     BackboneEvents.mixin(MyConstructor.prototype);
 *
 * (c) 2009-2013 Jeremy Ashkenas, DocumentCloud Inc.
 * (c) 2013 Nicolas Perriault
 */
/* global exports:true, define, module */
(function() {
  var root = this,
      breaker = {},
      nativeForEach = Array.prototype.forEach,
      hasOwnProperty = Object.prototype.hasOwnProperty,
      slice = Array.prototype.slice,
      idCounter = 0;

  // Returns a partial implementation matching the minimal API subset required
  // by Backbone.Events
  function miniscore() {
    return {
      keys: Object.keys,

      uniqueId: function(prefix) {
        var id = ++idCounter + '';
        return prefix ? prefix + id : id;
      },

      has: function(obj, key) {
        return hasOwnProperty.call(obj, key);
      },

      each: function(obj, iterator, context) {
        if (obj == null) return;
        if (nativeForEach && obj.forEach === nativeForEach) {
          obj.forEach(iterator, context);
        } else if (obj.length === +obj.length) {
          for (var i = 0, l = obj.length; i < l; i++) {
            if (iterator.call(context, obj[i], i, obj) === breaker) return;
          }
        } else {
          for (var key in obj) {
            if (this.has(obj, key)) {
              if (iterator.call(context, obj[key], key, obj) === breaker) return;
            }
          }
        }
      },

      once: function(func) {
        var ran = false, memo;
        return function() {
          if (ran) return memo;
          ran = true;
          memo = func.apply(this, arguments);
          func = null;
          return memo;
        };
      }
    };
  }

  var _ = miniscore(), Events;

  // Backbone.Events
  // ---------------

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  Events = {

    // Bind an event to a `callback` function. Passing `"all"` will bind
    // the callback to all events fired.
    on: function(name, callback, context) {
      if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
      this._events || (this._events = {});
      var events = this._events[name] || (this._events[name] = []);
      events.push({callback: callback, context: context, ctx: context || this});
      return this;
    },

    // Bind an event to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function(name, callback, context) {
      if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
      var self = this;
      var once = _.once(function() {
        self.off(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
      return this.on(name, once, context);
    },

    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    off: function(name, callback, context) {
      var retain, ev, events, names, i, l, j, k;
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
      if (!name && !callback && !context) {
        this._events = {};
        return this;
      }

      names = name ? [name] : _.keys(this._events);
      for (i = 0, l = names.length; i < l; i++) {
        name = names[i];
        if (events = this._events[name]) {
          this._events[name] = retain = [];
          if (callback || context) {
            for (j = 0, k = events.length; j < k; j++) {
              ev = events[j];
              if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
                  (context && context !== ev.context)) {
                retain.push(ev);
              }
            }
          }
          if (!retain.length) delete this._events[name];
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(name) {
      if (!this._events) return this;
      var args = slice.call(arguments, 1);
      if (!eventsApi(this, 'trigger', name, args)) return this;
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, arguments);
      return this;
    },

    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    stopListening: function(obj, name, callback) {
      var listeners = this._listeners;
      if (!listeners) return this;
      var deleteListener = !name && !callback;
      if (typeof name === 'object') callback = this;
      if (obj) (listeners = {})[obj._listenerId] = obj;
      for (var id in listeners) {
        listeners[id].off(name, callback, this);
        if (deleteListener) delete this._listeners[id];
      }
      return this;
    }

  };

  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function(obj, action, name, rest) {
    if (!name) return true;

    // Handle event maps.
    if (typeof name === 'object') {
      for (var key in name) {
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
      return false;
    }

    // Handle space separated event names.
    if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, l = names.length; i < l; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
      return false;
    }

    return true;
  };

  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Backbone events have 3 arguments).
  var triggerEvents = function(events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
    }
  };

  var listenMethods = {listenTo: 'on', listenToOnce: 'once'};

  // Inversion-of-control versions of `on` and `once`. Tell *this* object to
  // listen to an event in another object ... keeping track of what it's
  // listening to.
  _.each(listenMethods, function(implementation, method) {
    Events[method] = function(obj, name, callback) {
      var listeners = this._listeners || (this._listeners = {});
      var id = obj._listenerId || (obj._listenerId = _.uniqueId('l'));
      listeners[id] = obj;
      if (typeof name === 'object') callback = this;
      obj[implementation](name, callback, this);
      return this;
    };
  });

  // Aliases for backwards compatibility.
  Events.bind   = Events.on;
  Events.unbind = Events.off;

  // Mixin utility
  Events.mixin = function(proto) {
    var exports = ['on', 'once', 'off', 'trigger', 'stopListening', 'listenTo',
                   'listenToOnce', 'bind', 'unbind'];
    _.each(exports, function(name) {
      proto[name] = this[name];
    }, this);
    return proto;
  };

  // Export Events as BackboneEvents depending on current context
  if (typeof define === "function") {
    define(function() {
      return Events;
    });
  } else if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = Events;
    }
    exports.BackboneEvents = Events;
  } else {
    root.BackboneEvents = Events;
  }
})(this);

},{}],4:[function(require,module,exports){
module.exports = require('./backbone-events-standalone');

},{"./backbone-events-standalone":3}],5:[function(require,module,exports){
module.exports = require('./lib/timeout');
},{"./lib/timeout":6}],6:[function(require,module,exports){
(function(exports){
    var MAX_INT = 2147483647;
    var timeouts = {};
    var index = 1;

    // Set new timeout
    var set = function(callback, timeout){
        var id = index++;
        if(timeout > MAX_INT){
            timeouts[id] = setTimeout(set.bind(undefined, callback, timeout - MAX_INT), MAX_INT);
        }else{
            if(timeout < 0) timeout = 0;
            timeouts[id] = setTimeout(function(){
                delete timeouts[id];
                callback();
            }, timeout);
        }
        return id;
    };

    // Clear existing timeout
    var clear = function(id){
        if(timeouts.hasOwnProperty(id)){
            clearTimeout(timeouts[id]);
            delete timeouts[id];
        }
    };

    // Expose public interface
    exports.set = set;
    exports.clear = clear;
    exports._timeouts = timeouts;

})(typeof module === 'undefined' && typeof exports === 'undefined'? this.timeout = {} : exports);
},{}],7:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}]},{},[1])
(1)
});
;