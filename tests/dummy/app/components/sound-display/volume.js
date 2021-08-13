import Component from "@glimmer/component";
import { inject as service } from "@ember/service";
import { tracked } from "@glimmer/tracking";
import { action } from '@ember/object';
export default class Volume extends Component {
  @service stereo;
  @tracked dragAdjustment = 0;
  @tracked alreadyChanged = 0;
  @tracked element;
  notchCount = 20;

  get numOfNotches() {
    return new Array(this.notchCount);
  }

  get activeNotches() {
    return parseInt((this.stereo.volume / 100) * this.notchCount, 10);
  }

  get notchWidth() {
    return this.element.getBoundingClientRect().width / this.numOfNotches
  }

  @action
  didInsert(el) {
    this.element = el;
  }

  @action
  handlePanEnd(e) {
    this.dragAdjustment = 0;
  }

  @action
  handlePan(currentVolume, e) {
    const { deltaX } = e.gesture;

    let width = this.element.getBoundingClientRect().width;
    let change = parseInt((deltaX / width) * 100, 10);
    let existingChange = parseInt((this.dragAdjustment / width) * 100, 10);
    let newChange = change - existingChange

    this.stereo.volume = Math.max(Math.min(this.stereo.volume + newChange, 100), 0);
    this.dragAdjustment = deltaX;
  }

  @action
  handleTap(e) {
    const { center } = e.gesture;
    let rect = this.element.getBoundingClientRect();
    let volumePercentage = ((center.x - rect.x) / rect.width) * 100;
    let newVolume = Math.max(Math.min(volumePercentage, 100), 0);
    this.stereo.volume = newVolume;
  }
}