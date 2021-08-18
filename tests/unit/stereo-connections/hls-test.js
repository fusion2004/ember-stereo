import { A } from '@ember/array';
import { setupTest } from 'ember-qunit';
import sinon from 'sinon';
import { module, test } from 'qunit';
import HLSConnection from 'ember-stereo/stereo-connections/hls';
import { setupHLSSpies, throwMediaError } from '../../helpers/hls-test-helpers';

let sandbox;
const goodUrl = "http://example.org/good.m3u8";
const badUrl  = "http://example.org/bad.m3u8";

module('Unit | Connection | HLS', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    sandbox = sinon.createSandbox({
      useFakeServer: true
    });

    sandbox.server.respondWith(goodUrl, function (xhr) {
      xhr.respond(200, {}, []);
    });

    sandbox.server.respondWith(badUrl, function (xhr) {
      xhr.respond(404, {}, []);
    });
  });

  hooks.afterEach(function() {
    sandbox.restore();
  });

  test("HLS connection should say it can play files with m3u8 extension", function(assert) {
    let goodUrls = A([
      "http://example.org/test.m3u8",
      "http://example.org/test.m3u8?query_params",
      "http://example.org/test.m3u8#could_happen?maybe"
    ]);

    let badUrls = A([
      "http://example.org/test.mp3",
      "http://example.org/test.aac",
      "http://example.org/test.wav"
    ]);

    assert.expect(badUrls.length + goodUrls.length);

    badUrls.forEach(url => {
      assert.false(HLSConnection.canPlay(url), `Should not play file with ${url}`);
    });

    goodUrls.forEach(url => {
      assert.true(HLSConnection.canPlay(url), `Should be able to play file with ${url}`);
    });
  });

  test("HLS connection should report playability of file objects", function(assert) {
    let goodFiles = A([
      {url: "http://example.org/test.m3u8", mimeType: "application/vnd.apple.mpegurl"},
    ]);

    let badFiles = A([
      {url: "http://example.org/test.mp3", mimeType: "audio/mpeg"},
      {url: "http://example.org/test.aac", mimeType: "audio/aac"},
      {url: "http://example.org/test.wav", mimeType: "audio/wav"}
    ]);

    assert.expect(badFiles.length + goodFiles.length);

    badFiles.forEach(url => {
      assert.false(HLSConnection.canPlay(url), `Should not play file with mime type ${url.mimeType}`);
    });

    goodFiles.forEach(url => {
      assert.true(HLSConnection.canPlay(url), `Should be able to play file with ${url.mimeType}`);
    });
  });

  test("On first media error stream will attempt a retry", function(assert) {
    let sound = new HLSConnection({url: goodUrl, timeout: false});

    let {
      destroySpy, switchSpy, recoverSpy
    } = setupHLSSpies(sound.hls, sandbox);

    throwMediaError(sound);

    assert.equal(recoverSpy.callCount, 1, "should try media recovery");
    assert.equal(switchSpy.callCount, 0, "should not try codec switching yet");
    assert.equal(destroySpy.callCount, 0, "should not destroy");
  });

  test("On second media error stream will try switching codecs", function(assert) {
    let sound = new (this.owner.factoryFor('ember-stereo@stereo-connection:hls', {}).class)({url: goodUrl,
      timeout: false})

    let {
      destroySpy, switchSpy, recoverSpy
    } = setupHLSSpies(sound.hls, sandbox);

    throwMediaError(sound);
    throwMediaError(sound);

    assert.equal(recoverSpy.callCount, 2, "should try media recovery");
    assert.equal(switchSpy.callCount, 1, "should try switching yet");
    assert.equal(destroySpy.callCount, 0, "should not destroy");
  });

  test("On third media error we will give up", function(assert) {
    let done = assert.async();
    let sound = new (this.owner.factoryFor('ember-stereo@stereo-connection:hls', {}).class)({
      url: goodUrl,
      timeout: false
    })
    let loadErrorFired  = false;

    sound.on('audio-load-error', function() {
      loadErrorFired = true;
      done();
    });

    let {
      destroySpy, switchSpy, recoverSpy
    } = setupHLSSpies(sound.hls, sandbox);

    throwMediaError(sound);
    throwMediaError(sound);
    throwMediaError(sound);

    assert.equal(recoverSpy.callCount, 2, "should try media recovery");
    assert.equal(switchSpy.callCount, 1, "should try switching yet");
    assert.equal(destroySpy.callCount, 1, "should destroy");
    assert.ok(loadErrorFired, "should have triggered audio load error");
  });

  test("If we 404, we give up", function(assert) {
    assert.expect(2);
    let done = assert.async();

    let Connection = this.owner.lookup('service:stereo').connectionLoader.get('HLS')
    let sound = new Connection({
      url: badUrl,
      timeout: 1
    })

    sound.one('audio-load-error', function() {
      assert.ok(true, "should have triggered audio load error");
      done();
    });

    assert.ok(sound);
  });

  // test('it surfaces currentTime if EXT-PROGRAM-DATE-TIME is present')

  // test('it reads HLS comments as id3metadata.title')

  // test('it keeps current time if pausing and restarting the stream multiple times')

});
