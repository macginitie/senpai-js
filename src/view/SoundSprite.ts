import { EventEmitter } from "events";
import { IPlayable, IPlaying } from "../util";

// ISoundSpriteSheetTexture
export interface ISoundSpriteSheetTexture {
  [name: string]: {
    start: number;
    end: number;
    loop: boolean;
  };
}

// ISoundSpriteSheet
// TODO: Comment the fields
export interface ISoundSpriteSheet {
  resources: string[]; // TODO: actually use resources?
  spritemap: {
    [name: string]: ISoundSpriteSheetTexture;
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
  setTexture(texture: string): this;
}

// ISoundSpriteProps
// TODO: Comment the fields
export interface ISoundSpriteProps {
  id: string;
  context: AudioContext;
  name: string;
  // source: AudioBufferSourceNode;
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
  // public source: AudioBufferSourceNode = null;

  // Contains a list of currently playing and paused nodes
  // Automatically cleaned up when a node finishes playing
  public playing: IPlaying[] = [];

  public id: string = "";

  // NOTE: Can multiple source nodes be connected to the same gain node?
  // Yes, probably...
  // TODO: test this
  public gain: GainNode = null;

  public definition: ISoundSpriteSheet;

  private context: AudioContext = null;
  private buffer: AudioBuffer = null;
  private texture: ISoundSpriteSheetTexture = null; // set by setTexture

  // TODO: give better type
  private idToNode: any = {};

  private events: IAudioEventDefinition[] = [
    { type: "ended", event: (event: Event) => this.onEnded(event) },
  ];

  // constructor
  public constructor(props: ISoundSpriteProps) {
    super();
    this.id              = props.id;
    this.context         = props.context;
    this.gain            = props.context.createGain();
    this.buffer          = props.buffer;
    this.definition      = props.definition;
    this.gain.gain.value = props.hasOwnProperty("volume") ? props.volume : 1;
    if (props.hasOwnProperty("texture"))
      this.setTexture(props.texture);
  }

  /**
   * Set the texture before calling the play() method.
   *
   * @param texture the name of the texture to play next
   *
   * @throw Exception if the texture is not in the spritemap of this
   * SoundSprite's definition
   */
  public setTexture(texture: string): this {
    if (!this.definition.spritemap[texture]) {
      throw new Error(`Texture (${texture}) not found on sprite ${this.id}.`);
    }
    this.texture = this.definition.spritemap[texture];
    return this;
  }

  // play
  // TODO: Handle argument
  public play(pausedTarget ?: IPlaying): IPlaying {
    const sound = this.texture;
    // TODO: Find corresponding IPlaying object in the playing array in order to
    // determine if it's currently playing. If there is no corresponding object,
    // it is not playing. Not sure exactly how to do so, but there is probably a
    // way.
    // TODO: Check if texture is defined
    if (!this.playing) {
      const source = this.context.createBufferSource();
      source.buffer = this.buffer;
      source.loop = sound.loop; // change
      source.start(0, sound.start, sound.end); // change

      const now = Date.now();
      const length = sound.end - sound.start;
      const playingObject: IPlaying = {
        current: now,
        end: now + length,
        id : this.id,
        length,
        parent : 0,
        start : now,
        state : "playing",
        texture: this.texture,
      };
      this.playing.push(playingObject);

      if (sound.loop) {
        source.loopStart = sound.start;
        source.loopEnd = sound.end;
        source.loop = true;
      }

      // store the source node in an id-indexed map
      this.idToNode[this.id] = source;
      this.id++;

      super.emit("audio-playing", this);
      return playingObject;
    }

    // TODO: update condition
    if (this.paused) {
      // TODO: use playing object's parameters
      this.started = Date.now() - this.startAt;
      this.source.start(0, sound.start + this.startAt, sound.end); // change
      this.paused = false;
      super.emit("audio-playing", this);
      return;
    }
  }

  // pause
  // TODO: update signature
  public pause(): void {
    // TODO: Update condition
    if (this.playing && !this.paused) {
      const sound = this.definition.spritemap[this.sound];
      this.startAt = (Date.now() - this.started) % (sound.end - sound.start);
      this.paused = true;
      this.source.stop(0); // change

      super.emit("audio-paused", this);
    }
  }

  // stop
  // TODO: update signature
  public stop(): void {
    // TODO: Update condition
    if (this.playing) {
        this.source.stop(0); // change
        this.paused = false;
        this.playing = false;
        this.startAt = 0;
        this.source.loop = false; // change
        this.source.loopStart = 0; // change
        this.source.loopEnd = 0; // change

        super.emit("audio-stopped", this);
        return;
    }
  }

  // dispose: disconnect from gain and remove event listeners from node
  public dispose(source: AudioBufferSourceNode) {
    source.disconnect(this.gain);
    this.events.forEach(e => source.removeEventListener(e.type, e.event));
  }

  // setup: connect to gain and add event listeners to node
  private setup(source: AudioBufferSourceNode): void {
    source.connect(this.gain);
    this.events.forEach(e => source.addEventListener(e.type, e.event));
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
  props.buffer = audioBuffer;
  return new SoundSprite(props);
}
