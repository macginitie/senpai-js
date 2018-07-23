import { EventEmitter } from "events";
import { IPlaying, IPlayable } from "../util"

// ISoundSpriteSheet
// TODO: Comment the fields
export interface ISoundSpriteSheet {
  resources: string[]; // TODO: actually use resources?
  spritemap: {
    [name: string]: {
      start: number;
      end: number;
      loop: boolean;
    };
  };
}

// ISoundSprite
// TODO: Determine whether I can get away with not defining all of the things in
// this interface given that the interface it extends already does
// TODO: Comment the fields
export interface ISoundSprite extends IPlayable {
  id: string; // not sure I need
  gain: GainNode; // possibly enough with one
  definition: ISoundSpriteSheet;
  setTexture(texture : string) : void;
}

// ISoundSpriteProps
// TODO: Comment the fields
export interface ISoundSpriteProps {
  id: string;
  context: AudioContext;
  name: string;
  //source: AudioBufferSourceNode;
  definition: ISoundSpriteSheet;
  volume?: number;
}

// IAudioEventDefinition
export interface IAudioEventDefinition {
  type: string;
  event: (event: Event) => void;
}

// SoundSprite

// 1. Constructor still takes same kind of argument?
export class SoundSprite extends EventEmitter implements ISoundSprite {
  // NOTE: Not needed here, but kept so I remember the type
  //public source: AudioBufferSourceNode = null;

  // Contains a list of currently playing and paused nodes
  // Automatically cleaned up when a node finishes playing
  public playing : IPlaying[];
    
  public id: string = ""; // NOTE: Do I need this?
    
  // NOTE: Can multiple source nodes be connected to the same gain node?
  // Yes, probably...
  // TODO: test this
  public gain: GainNode = null;
    
  public definition: ISoundSpriteSheet;
  private texture: string = ""; // set by setTexture
  // TODO: give better type
  private idToNode : any = {};

  private events: IAudioEventDefinition[] = [
    { type: "ended", event: (event: Event) => this.onEnded(event) },
  ];

  // constructor
  public constructor(props: ISoundSpriteProps) {
    super();
    this.id = props.id;
    this.source = props.source;
    this.gain = props.context.createGain();
    this.definition = props.definition;
    this.gain.gain.value = props.hasOwnProperty("volume") ? props.volume : 1;
    this.setup();
  }

  // play
  public play(): void {
    const sound = this.definition.spritemap[this.sound];

    if (!this.playing) {
      this.source.loop = sound.loop;
      this.source.start(0, sound.start, sound.end);
      this.started = Date.now();
      this.playing = true;

      if (sound.loop) {
        this.source.loopStart = sound.start;
        this.source.loopEnd = sound.end;
        this.source.loop = true;
      }

      super.emit("audio-playing", this);
      return;
    }

    if (this.paused) {
      this.started = Date.now() - this.startAt;
      this.source.start(0, sound.start + this.startAt, sound.end);
      this.paused = false;
      super.emit("audio-playing", this);
      return;
    }
  }

  // pause
  public pause(): void {
    if (this.playing && !this.paused) {
      const sound = this.definition.spritemap[this.sound];
      this.startAt = (Date.now() - this.started) % (sound.end - sound.start);
      this.paused = true;
      this.source.stop(0);

      super.emit("audio-paused", this);
    }
  }

  // stop
  public stop(): void {
    if (this.playing) {
      this.source.stop(0);
      this.paused = false;
      this.playing = false;
      this.startAt = 0;
      this.source.loop = false;
      this.source.loopStart = 0;
      this.source.loopEnd = 0;

      super.emit("audio-stopped", this);
      return;
    }
  }

  // setup: connect to gain and add event listeners to node
  private setup(): void {
    this.source.connect(this.gain);
    this.events.forEach(e => this.source.addEventListener(e.type, e.event));
  }
    
  // dispose: disconnect from gain and remove event listeners from node
  public dispose() {
    this.source.disconnect(this.gain);
    this.events.forEach(e => this.source.removeEventListener(e.type, e.event));
  }

  // onEnded: stop the texture from playing (note: in the event must be the texture)
  private onEnded(event: Event): void {
    this.stop();
  }

}

// async function loadSoundSprite
export interface ILoadSoundSpriteProps extends ISoundSpriteProps {
  src: string;
  context: AudioContext;
  definition: ISoundSpriteSheet;
}

export async function loadSoundSprite(props: ILoadSoundSpriteProps): Promise<ISoundSprite> {
  const response = await fetch(props.src);
  const buffer = await response.arrayBuffer();
  const audioBuffer = await props.context.decodeAudioData(buffer);
  const source = props.context.createBufferSource();
  source.buffer = audioBuffer;
  props.source = source;
  return new SoundSprite(props);
}
