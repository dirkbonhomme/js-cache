var expect = require('expect.js');
var sinon = require('sinon');
var cache = require('../lib/cache');

describe('Cache', function(){

    var cache1;
    beforeEach(function(){
        cache1 = new cache();
    });

    describe('Global instance', function(){
        it('should expose public interface', function(){
            var p = cache.Cache.prototype;
            Object.keys(p).forEach(function(key){
                expect(typeof p[key]).to.be(typeof cache[key]);
            });
        });
    });

    describe('Public interface', function(){

        describe('#set', function(){
            it('should throw error on omitted key', function(){
                try{
                    cache1.set();
                    throw 'Should not reach this line';
                }catch(e){
                    expect(e.message).to.be('Required argument key is undefined');
                }
            });

            it('should accept undefined value', function(){
                cache1.set('lorem');
            });

            it('should emit set event', function(){
                var spy = sinon.spy();
                cache1.on('set', spy);
                cache1.set('lorem', 'ipsum', 123);
                expect(spy.callCount).to.be(1);
                expect(spy.args[0]).to.eql(['lorem', 'ipsum', 123]);
            });

            it('should emit set:key event', function(){
                var spy = sinon.spy();
                cache1.on('set:lorem', spy);
                cache1.set('lorem', 'ipsum', 123);
                expect(spy.callCount).to.be(1);
                expect(spy.args[0]).to.eql(['ipsum', 123]);
            });

            it('should emit update event', function(){
                var spy = sinon.spy();
                cache1.on('update', spy);
                cache1.set('lorem', 'original');
                cache1.set('lorem', 'ipsum', 123);
                expect(spy.callCount).to.be(1);
                expect(spy.args[0]).to.eql(['lorem', 'ipsum', 123]);
            });

            it('should emit update:key event', function(){
                var spy = sinon.spy();
                cache1.on('update:lorem', spy);
                cache1.set('lorem', 'original');
                cache1.set('lorem', 'ipsum', 123);
                expect(spy.callCount).to.be(1);
                expect(spy.args[0]).to.eql(['ipsum', 123]);
            });

            it('should emit exactly two events', function(){
                var spy = sinon.spy();
                cache1.on('all', spy);
                cache1.set('lorem', 'ipsum');
                expect(spy.callCount).to.be(2);
            });
        });

        describe('#get', function(){
            it('should throw error on omitted key', function(){
                try{
                    cache1.get();
                    throw 'Should not reach this line';
                }catch(e){
                    expect(e.message).to.be('Required argument key is undefined');
                }
            });

            it('should return saved data', function(){
                var data = {ipsum: 'dolor'};
                cache1.set('lorem', data);
                expect(cache1.get('lorem')).to.be.eql(data);
            });

            it('should return undefined on unknown key', function(){
                expect(cache1.get('foo')).to.be(undefined);
            });

            it('should return undefined on provided callback', function(){
                cache1.set('lorem', 'ipsum');
                var result = cache1.get('lorem', sinon.spy());
                expect(result).to.be(undefined);
            });

            it('should call callback with saved data', function(done){
                var callback = sinon.spy(function(){
                    expect(callback.callCount).to.be(1);
                    expect(callback.args[0]).to.eql(['ipsum']);
                    done();
                });
                cache1.set('lorem', 'ipsum');
                cache1.get('lorem', callback);
            });
        });

        describe('#del', function(){
            it('should throw error on omitted key', function(){
                try{
                    cache1.del();
                    throw 'Should not reach this line';
                }catch(e){
                    expect(e.message).to.be('Required argument key is undefined');
                }
            });

            it('should actually delete data', function(){
                cache1.set('lorem', 'ipsum');
                expect(cache1.get('lorem')).to.be('ipsum');
                cache1.del('lorem');
                expect(cache1.get('lorem')).to.be(undefined);
            });

            it('should return true on known key', function(){
                cache1.set('lorem', 'ipsum');
                expect(cache1.del('lorem')).to.be(true);
            });

            it('should return false on unknown key', function(){
                expect(cache1.del('lorem')).to.be(false);
            });

            it('should not emit events on unknown key', function(){
                var spy = sinon.spy();
                cache1.on('all', spy);
                cache1.del('lorem');
                expect(spy.callCount).to.be(0);
            });

            it('should emit del event', function(){
                var spy = sinon.spy();
                cache1.on('del', spy);
                cache1.set('lorem', 'ipsum');
                cache1.del('lorem');
                expect(spy.callCount).to.be(1);
                expect(spy.args[0]).to.eql(['lorem']);
            });

            it('should emit del:key event', function(){
                var spy = sinon.spy();
                cache1.on('del:lorem', spy);
                cache1.set('lorem', 'ipsum');
                cache1.del('lorem');
                expect(spy.callCount).to.be(1);
                expect(spy.args[0]).to.eql([]);
            });

            it('should emit exactly two events', function(){
                var spy = sinon.spy();
                cache1.set('lorem', 'ipsum');
                cache1.on('all', spy);
                cache1.del('lorem');
                expect(spy.callCount).to.be(2);
            });
        });

        describe('#clear', function(){
            it('should remove all known data', function(){
                cache1.set('lorem', 'ipsum');
                cache1.set('foo', 'bar');
                expect(cache1.get('lorem')).to.be('ipsum');
                expect(cache1.get('foo')).to.be('bar');
                cache1.clear();
                expect(cache1.get('lorem')).to.be(undefined);
                expect(cache1.get('foo')).to.be(undefined);
            });

            it('should return number of cleared records', function(){
                cache1.set('lorem', 'ipsum');
                cache1.set('foo', 'bar');
                expect(cache1.clear()).to.be(2);
            });

            it('should emit clear event', function(){
                var spy = sinon.spy();
                cache1.on('clear', spy);
                cache1.set('lorem', 'ipsum');
                cache1.clear();
                expect(spy.callCount).to.be(1);
                expect(spy.args[0]).to.eql([1]);
            });
        });

        describe('#size', function(){
            it('should return 0 after init', function(){
                var cache1 = new cache();
                expect(cache1.size()).to.be(0);
            });

            it('should return number of available records', function(){
                cache1.set('lorem', 'ipsum');
                cache1.set('foo', 'bar');
                cache1.set('santa', 'claus');
                cache1.del('foo');
                expect(cache1.size()).to.be(2);
            });
        });

        describe('#debug', function(){
            it('should return empty object after init', function(){
                var cache1 = new cache();
                expect(cache1.debug()).to.eql({});
            });

            it('should return internal cache', function(){
                cache1.set('lorem', 'ipsum');
                cache1.set('foo', 'bar', 123);
                var result = cache1.debug();
                expect(Object.keys(result)).to.eql(['lorem', 'foo']);
                expect(result.lorem.value).to.be('ipsum');
                expect(result.foo.value).to.be('bar');
                expect(result.foo).to.have.property('timeout');
            });
        });

        describe('#keys', function(){
            it('should return empty array after init', function(){
                var cache1 = new cache();
                expect(cache1.keys()).to.eql([]);
            });

            it('should return list of keys', function(){
                cache1.set('lorem', 'ipsum');
                cache1.set('foo', 'bar');
                cache1.set('santa', 'claus');
                cache1.del('foo');
                var result = cache1.keys();
                expect(result).to.eql(['lorem', 'santa']);
            });
        });
    });

    describe('Timeouts', function(){
        it('should return value before timeout', function(){
            cache1.set('lorem', 'ipsum', 5);
            expect(cache1.get(('lorem'))).to.be('ipsum');
        });

        it('should return undefined after timeout', function(done){
            cache1.set('lorem', 'ipsum', 5);
            setTimeout(function(){
                expect(cache1.get(('lorem'))).to.be(undefined);
                done();
            }, 6);
        });

        it('should return value before timeout with ttl of 0', function(){
            cache1.set('lorem', 'ipsum', 0);
            expect(cache1.get(('lorem'))).to.be('ipsum');
        });

        it('should return undefined after timeout with ttl of 0', function(done){
            cache1.set('lorem', 'ipsum', 0);
            setTimeout(function(){
                expect(cache1.get(('lorem'))).to.be(undefined);
                done();
            }, 6);
        });

        it('should return value before timeout with negative ttl', function(){
            cache1.set('lorem', 'ipsum', -5);
            expect(cache1.get(('lorem'))).to.be('ipsum');
        });

        it('should return undefined after timeout with negative ttl', function(done){
            cache1.set('lorem', 'ipsum', -5);
            setTimeout(function(){
                expect(cache1.get(('lorem'))).to.be(undefined);
                done();
            }, 6);
        });

        it('should return undefined after timeout', function(done){
            cache1.set('lorem', 'ipsum', 5);
            setTimeout(function(){
                expect(cache1.get(('lorem'))).to.be(undefined);
                done();
            }, 6);
        });

        it('should clear timeout on new set', function(done){
            cache1.set('lorem', 'ipsum', 5);
            cache1.set('lorem', 'dolor');
            setTimeout(function(){
                expect(cache1.get(('lorem'))).to.be('dolor');
                done();
            }, 6);
        });

        it('should emit del events after timeout', function(done){
            var spy = sinon.spy();
            cache1.on('del del:lorem', spy);
            cache1.set('lorem', 'ipsum', 5);
            setTimeout(function(){
                expect(spy.callCount).to.be(2);
                done();
            }, 6);
        });
    });

    describe('External resources', function(){

        var cache1, setSpy, getSpy, delSpy, clearSpy;
        beforeEach(function(){
            setSpy = sinon.spy();
            getSpy = sinon.spy();
            delSpy = sinon.spy();
            clearSpy = sinon.spy();
            cache1 = new cache({
                set: setSpy,
                get: getSpy,
                del: delSpy,
                clear: clearSpy
            });
        });

        describe('#set', function(){
            it('should call external:set with all arguments', function(){
                cache1.set('lorem', 'ipsum', 123);
                expect(setSpy.callCount).to.be(1);
                expect(setSpy.args[0]).to.be.eql(['lorem', 'ipsum', 123]);
            });
        });

        describe('#get', function(){
            it('should not call external:get if callback omitted', function(){
                cache1.get('lorem');
                expect(getSpy.callCount).to.be(0);
            });

            it('should call external:get with key', function(){
                var callback = sinon.spy();
                cache1.get('lorem', callback);
                expect(getSpy.callCount).to.be(1);
                expect(getSpy.args[0]).to.be.eql(['lorem', callback]);
            });

            it('should not call external:get if key is known', function(){
                var callback = sinon.spy();
                cache1.set('lorem');
                cache1.get('lorem', callback);
                expect(getSpy.callCount).to.be(0);
            });
        });

        describe('#del', function(){
            it('should call external:del with key if key is known', function(){
                cache1.set('lorem', 'ipsum');
                cache1.del('lorem');
                expect(delSpy.callCount).to.be(1);
                expect(delSpy.args[0]).to.be.eql(['lorem']);
            });

            it('should call external:del with key if key is not known', function(){
                cache1.del('lorem');
                expect(delSpy.callCount).to.be(1);
                expect(delSpy.args[0]).to.be.eql(['lorem']);
            });

            it('should not call external:del after local timeout', function(done){
                var spy = sinon.spy();
                cache1.on('del del:lorem', spy);
                cache1.set('lorem', 'ipsum', 5);
                setTimeout(function(){
                    expect(delSpy.callCount).to.be(0);
                    done();
                }, 6);
            });
        });

        describe('#clear', function(){
            it('should call external:clear', function(){
                cache1.clear('lorem');
                expect(clearSpy.callCount).to.be(1);
                expect(clearSpy.args[0]).to.be.eql([]);
            });
        });

    });

});