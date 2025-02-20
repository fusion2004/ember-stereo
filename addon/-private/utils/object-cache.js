import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';
import normalizeIdentifier from './normalize-identifier';
import { TrackedObject, TrackedWeakMap } from 'tracked-built-ins';

function isAnObject(identifier) {
  return (
    identifier !== undefined &&
    identifier !== null &&
    (typeof identifier === 'object' || identifier.then)
  );
}

/**
 * This class caches things based on a strings or objects. You shouldn't have to interact with this class.
 */
export default class ObjectCache {
  @service stereo; // used by subclasses

  @tracked objectCache = new TrackedWeakMap();
  @tracked keyCache = new TrackedObject();
  name = 'ember-stereo:object-cache';

  has(_identifier) {
    let identifier = normalizeIdentifier(_identifier);
    if (isAnObject(identifier)) {
      return this.objectCache.has(identifier);
    } else {
      return identifier in this.keyCache;
    }
  }

  find(_identifier) {
    let identifier = normalizeIdentifier(_identifier);

    if (isAnObject(identifier) && this.objectCache.has(identifier)) {
      return this.objectCache.get(identifier);
    } else if (this.keyCache[identifier]) {
      return this.keyCache[identifier];
    }
  }

  remove(_identifier) {
    let identifier = normalizeIdentifier(_identifier);

    if (isAnObject(identifier) && this.objectCache.has(identifier)) {
      this.objectCache.delete(identifier);
    }
    if (this.keyCache[identifier]) {
      delete this.keyCache[identifier];
    }
  }

  store(_identifier, value) {
    let identifier = normalizeIdentifier(_identifier);

    if (identifier) {
      if (isAnObject(identifier)) {
        this.objectCache.set(identifier, value);
      } else {
        this.keyCache[identifier] = value;
      }
    }
  }
}
