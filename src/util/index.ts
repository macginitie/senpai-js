import { ISprite } from "../view/Sprite";

export interface IPoint {
  x: number;
  y: number;
}

export interface ISize {
  width: number;
  height: number;
}

export interface ISpriteSheetSize {
  w: number;
  h: number;
}

export interface ISpriteSheetMeta {
  app: string;
  version: string;
  image: string;
  size: ISpriteSheetSize;
  scale: number;
}

export interface ISpriteSheetPoint {
  x: number;
  y: number;
}

export interface ISpriteSheetFrame {
  frame: ISpriteSheetPoint & ISpriteSheetSize;
  rotated: boolean;
  trimmed: boolean;
  spriteSourceSize: ISpriteSheetPoint & ISpriteSheetSize;
  sourceSize: ISpriteSheetSize;
}

export interface ISpriteSheetFrameMap {
  [frame: string]: ISpriteSheetFrame;
}

export interface ISpriteSheet {
  frames: ISpriteSheetFrameMap;
  meta: ISpriteSheetMeta;
}

export interface IInteractionPoint extends IPoint {
  id: string;
  type: "Touch" | "Mouse";
  down: boolean;
  clicked: boolean;
  captured: boolean;
  active: ISprite;
  hover: ISprite;
  firstDown: boolean;
  tx: number;
  ty: number;
}

export interface IKeyState {
  key: string;
  down: boolean;
}

export interface IKeyData {
  getKey(key: string): IKeyState;
}

export interface IKeyDataIndex {
  [key: string]: IKeyState;
}

export class KeyState implements IKeyState {
  public key: string = "";
  public down: boolean = false;
  constructor(key: string) {
    this.key = key;
  }
}

// tslint:disable-next-line:max-classes-per-file
export class KeyData implements IKeyData {
  public keys: IKeyDataIndex = {};

  // tslint:disable-next-line:no-empty
  constructor() { }

  public getKey(key: string): IKeyState {
    if (!this.keys.hasOwnProperty(key)) {
      this.keys[key] = new KeyState(key);
    }
    return this.keys[key];
  }
}

export interface ITextureMap {
  [texture: string]: ImageBitmap;
}

export async function loadImage(src: string): Promise<ImageBitmap> {
  const res = await fetch(src);
  const blob = await res.blob();
  const bmp = await createImageBitmap(blob);
  return bmp;
}

export async function loadSoundBuffer(source: Promise<Response>, start: number, finish: number) {
  const res = await source;
  const buffer = await res.arrayBuffer();
}

export interface ILoadProps {
  src: string;
  definition: ISpriteSheet;
}

export interface IPadding {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export async function createTextureMap(definition: ISpriteSheet, img: Promise<ImageBitmap>) {
  const textures: ITextureMap = {};
  await Promise.all(
    Object.entries(definition.frames).map(async ([desc, frame], i) => {
      textures[desc] = await createImageBitmap(
        await img,
        frame.frame.x,
        frame.frame.y,
        frame.frame.w,
        frame.frame.h,
      );
    }),
  );
  return textures;
}

export interface IHasParent {
  parent: string;
}

export enum TextAlign {
  "left" = "left",
  "right" = "right",
  "center" = "center",
  "start" = "start",
  "end" = "end",
}

export enum TextBaseline {
  "top" = "top",
  "hanging" = "hanging",
  "middle" = "middle",
  "alphabetic" = "alphabetic",
  "ideographic" = "ideographic",
  "bottom" = "bottom",
}

export function zSort(left: ISprite, right: ISprite): number {
  return left.z - right.z;
}

export enum PlayState {
  Playing,
  Paused,
  Stopped,
}

export interface ISoundSpriteSheetTexture {
  start: number;
  end: number;
  loop: boolean;
}

export interface ISoundSpriteSheet {
  resources: string[];
  spritemap: {
    [name: string]: ISoundSpriteSheetTexture;
  };
}

export interface IPlayable {
  started: number; // timestamp when the media last began playing
  length: number; // media play length timespan
  start: number; // media start time
  end: number; // media end time
  loop: boolean; // does this media loop?
  state: PlayState; // self explainatory
  loaded: Promise<void>; // this should be a promise that resolves once the audio has loaded
  play(): this;
  pause(): this;
  stop(): this;
  setVolume(volume: number); // accepts number [0. 1]
}

export interface IPlayableProps {
  source: Promise<Response>;
  texture: string; // this should be name of the texture in the spritesheet
}

export interface IAudioProps extends IPlayableProps {
  definition: ISoundSpriteSheet; // this will be the provided sound sprite sheet
  context: AudioContext; // provided audio context for creating the sound sprite
}

export interface IAudio extends IPlayable {
  gain: GainNode; // controls volume
  source: AudioBuffer; // is null until the audioBuffer is loaded
  destination: AudioNode;
  definition: ISoundSpriteSheet; // this will be the provided sound sprite sheet
  context: AudioContext; // provided audio context for creating the sound sprite
}
