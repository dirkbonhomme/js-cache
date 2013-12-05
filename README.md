# Caching library for JavaScript and Node.js

Caching library with support for timeouts, events and external data sources.

## Overview

* [Usage in Node.js](#usage-in-nodejs)
* [Usage in browsers](#usage-in-browsers)
* [Instance](#instance)
* [API](#api)
* [External data source](#external-data-source)
* [Events](#events)
* [Developing](#developing)
* [Building](#building)
* [Testing](#testing)

## Usage in Node.js  

    var cache = require('js-cache');
    cache.set('lorem', 'ipsum', 60000);
    console.log(cache.get('lorem'));
    
    var myCache = new cache();
    myCache.set('lorem', 'dolor', 60000);
    console.log(myCache.get('lorem'));


## Usage in browsers

    <script src="bundle/cache.js"></script> 
    <script>
        cache.set('lorem', 'ipsum', 60000);
        console.log(cache.get('lorem'));
    </script>

## Instance

It is possible to call the `cache` object directly:

    cache.set('lorem', 'ipsum');
    console.log(cache.get('lorem'));

or use it as a constructor to create a separate storage:

    var c2 = new cache();
    c2.set('lorem', 'dolor');
    console.log(c2.get('lorem'));

## API

### cache.set(`key`, `value`, `[ttl]`)

Cache data or update and existing record.

`key` Unique key identifying the cache  
`value` Cached value  
`ttl` Time to live in milliseconds (optional) 

### cache.get(`key`, `[callback]`)

Get cached value. Returns cached value (or undefined) if no callback was provided. Always returns undefined if callback argument is present.

`key` Key identifying the cache  
`callback` Return value in callback if record exists in memory or on external resource (optional)

### cache.del(`key`)

Delete cached data. Returns true if the record existed, false if not.

`key` Key identifying the cache

### cache.clear()

Clear all cached data. Returns number of cleared records.

### cache.size()
                
Returns number of cached records.

### cache.debug()

Returns internal object with cached records.

## External data source

It is possible to forward api requests to external handlers. They can be used for logging, storing in persistent database etc. The cache library will function as a temporary, in-memory layer.

    var c = new cache({
        set: setHandler,
        get: getHandler,
        del: delHandler,
        clear: clearHandler
    });
    
All handlers are optional.
    
`setHandler` is called with `key`, `value`, `ttl` on cache.set().  

`getHandler` is called with `key`, `callback` on cache.get() when a callback is provided and the key is not present in the cache. The getHandler is required to execute `callback`.  

`delHandler` is called with `key` on cache.del(). It is not called when a cached record times out.  

`clearHandler` is called without arguments on cache.clear().  

## Events

The cache library uses the Backbone event framework. Please refer to their [documentation](http://backbonejs.org/#Events) for a detailed overview. 

### set , set:key

Emitted when setting a value to a new record.

    cache.on('set', function(key, value, ttl){});
    cache.on('set:lorem', function(value, ttl){});
    cache.set('lorem', 'ipsum', 123);
    
### update, update:key

Emitted when updating the value or ttl of a known record.

    cache.set('lorem', 'ipsum');
    cache.on('update', function(key, value, ttl){});
    cache.on('update:lorem', function(value, ttl){});
    cache.set('lorem', 'ipsum', 123);

### del, del:key

Emitted when deleting a record or when a cached record times out.

    cache.set('lorem', 'ipsum');
    cache.on('del', function(key){});
    cache.on('del:lorem', function(){});
    cache.del('lorem');
    
### clear

Emitted when the cache gets cleared.

    cache.on('clear', function(size){});
    cache.clear();

## Developing

The library is published to NPM and can be installed with the following command:

    $ npm install js-cache
    
## Building

The scripts have to be bundled in order to use them in a browser. One of the tools you can use is browserify.

    $ sudo npm install browserify -g
    $ make browserify
    
This will build the script in `bundle/cache.js`

## Testing

Navigate to this module's repository and make sure you have the development modules installed:

    $ npm install


Run the tests:

    $ npm test

