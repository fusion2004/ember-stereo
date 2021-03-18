import { registerWaiter } from '@ember/test';
import { later } from '@ember/runloop';
import { module, test, skip } from 'qunit';
import { setupTest } from 'ember-qunit';
import { dummyHifi } from '../../../tests/helpers/hifi-integration-helpers';
import Ember from 'ember';

let originalOnError = Ember.onerror;
function catchExpectedErrors(expectedErrors) {
  Ember.onerror = function(error) {
    if (!expectedErrors.includes(error.message.replace(/(Uncaught\s)?Error:\s/, ""))) {
      // some environments will throw Uncaught Error, some will throw Error
      originalOnError.apply(window, arguments);
    }
  }
}

module('Unit | Service | hifi integration test.js', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    this.owner.register('service:hifi', dummyHifi);
    this.hifi = this.owner.lookup('service:hifi')
  });

  hooks.afterEach(function() {
    window.onerror = originalOnError;
  });

  test('playing good url works', async function(assert) {
    let service = this.owner.factoryFor('service:audio').create({})
    let { sound } = await service.playGood()
    assert.ok(sound);
  });

  // TODO: figure out how to effectively handle these errors. 
  skip('playing a bad url fails', async function(assert) {
    catchExpectedErrors(["All given promises failed."]);

    let service = this.owner.factoryFor('service:audio').create({});
    let failures, success = false;

    try {
      await service.playBad();
      success = true;
    } catch (results) {
      failures = results.failures;
      assert.ok(failures && failures.length > 0, "should have reported failures");
    }

    assert.equal(success, false, "should not be successful")
  });

  // TODO: figure out how to effectively handle these errors.
  skip('playing a blank url fails', async function(assert) {
    catchExpectedErrors(["[ember-hifi] URLs must be provided"]);
    let service = this.owner.factoryFor('service:audio').create({});
    let failures, results;

    try {
      await service.playBlank();
    } catch(r) {
      results = r;
      failures = results.failures;
      assert.ok(!failures, "should not be failures");
    }
  });

  test('it sets fixed duration correctly', async function(assert) {
    let hifi = this.owner.lookup('service:hifi');
    hifi.loadConnections([{name: 'DummyConnection'}]);

    let { sound } = await hifi.load('/good/2500/test')
    assert.equal(sound.duration, 2500);
  });

  test('by default it succeeds and pretends its a 1 second long file', async function(assert) {
    let hifi = this.owner.lookup('service:hifi');
    hifi.loadConnections([{name: 'DummyConnection'}]);

    let { sound } = await hifi.load('http://test.example')
    assert.equal(sound.duration, 1000);
  });

  test('it sets stream duration correctly', async function(assert) {
    let hifi = this.owner.lookup('service:hifi');
    hifi.loadConnections([{name: 'DummyConnection'}]);

    let { sound } = await hifi.load('/good/stream/test')
    assert.equal(sound.duration, Infinity, "duration should be infinity");
    assert.equal(sound.isStream, true, "should be stream");
  });

  test('it simulates play', function(assert) {
    registerWaiter(this, function() {
      return this.sound && this.sound._tickInterval * ticks === this.sound._currentPosition();
    });
    let done = assert.async();
    assert.expect(3);
    let service = this.owner.factoryFor('service:audio').create({});
    let hifi = service.get('hifi');
    let ticks = 5;

    hifi.play('/good/1500/test/yes').then(({sound}) => {
      this.sound = sound;
      let tickInterval = sound._tickInterval;
      assert.equal(sound._currentPosition(), 0, "initial position should be 0");
      later(() => {
        assert.equal(sound._currentPosition(), tickInterval * ticks, `position should be ${tickInterval * ticks}`);
        assert.equal(sound.isPlaying, true, "should be playing");
        done();
        sound.stop();
      }, (tickInterval * (ticks + 1)))
    });
  });

  test('it can not rewind before 0', async function(assert) {
    let done = assert.async();
    let hifi = this.owner.lookup('service:hifi');

    hifi.one('audio-will-rewind', ({newPosition}) => {
      assert.equal(newPosition, 0, "sound should be at the start");
      done();
    });

    await hifi.play('/good/10000/test')
    hifi.rewind(5000);
  });

  test('it can not fast forward past duration', function(assert) {
    let done = assert.async();
    let service = this.owner.factoryFor('service:audio').create({});
    let hifi = service.get('hifi');

    hifi.play('/good/1000/test').then(() => {
      hifi.fastForward(5000);
      assert.equal(hifi.get('position'), 1000, "sound should be at the end");
      done();
    });
  });

  test('it sends an audio-ended event when the sound ends',function(assert) {
    let done = assert.async();
    let hifi = this.owner.lookup('service:hifi');

    hifi.one('audio-ended', ({sound}) => {
      assert.equal(sound.position, 1000, "sound should be at the end");
      done();
    });

    hifi.play('/good/1000/test').then(() => {
      hifi.set('position', 15000);
    })
  });
});
