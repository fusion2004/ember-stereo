import { makeArray } from '@ember/array';
import Mixin from '@ember/object/mixin';
import BaseSound from './base';
import { Howl } from 'howler';

let ClassMethods = Mixin.create({
  rejectMimeTypes:  ['application/vnd.apple.mpegurl'],

  toString() {
    return 'Howler';
  }
});


/**
* This class connects with Howler to create sounds.
*
* @class Howler
* @constructor
* @extensionfor Base

*/
let Sound = BaseSound.extend({
  setup() {
    let urls = makeArray(this.get('url'));
    let sound = this;
    let options = Object.assign({
      src:      urls,
      autoplay: false,
      preload:  true,
      html5:    true,
      volume:   1,
      onload: function() {
        sound.set('url', this._src);
        sound.set('howl', this);
        sound.trigger('audio-loaded', sound);
        sound.trigger('audio-ready', sound);
      },
      onpause: function() {
        sound.trigger('audio-paused', sound);
      },
      onplay: function() {
        sound.trigger('audio-played', sound);
      },
      onend: function() {
        sound.trigger('audio-ended', sound);
      },
      onstop: function() {
        sound.trigger('audio-paused', sound);
      },
      onloaderror: function(id, error) {
        sound.trigger('audio-load-error', error);
      },
      onseek: function() {
        sound.trigger('audio-position-changed', sound._currentPosition());
      }
    }, this.get('options'));

    new Howl(options);
  },

  teardown() {
    let howl = this.get('howl');
    if (howl) {
      howl.unload();
    }
  },

  _audioDuration() {
    return this.get('howl').duration() * 1000;
  },

  _currentPosition() {
    return this.get('howl').seek() * 1000;
  },

  _setPosition(position) {
    this.get('howl').seek(position / 1000);
    return this._currentPosition();
  },

  _setVolume(volume) {
    this.get('howl').volume(volume/100);
  },

  play({position} = {}) {
    this.debug('#play');
    if (typeof position !== 'undefined') {
      this._setPosition(position);
    }
    this.get('howl').play();
  },

  pause() {
    this.debug('#pause');
    this.get('howl').pause();
  },

  stop() {
    this.debug('#stop');
    this.get('howl').stop();
  }
});

Sound.reopenClass(ClassMethods);

export default Sound;
