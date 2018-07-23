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

// IPlaying and IPlayable
//
// QUESTIONS:
// 1. setTexture only defines the texture targeted by play(), not by any other method?
// 2. setTexture behavior on invalid texture string (guess: noop)
// 3. play() behavior when valid texture not set (guess: noop)
// 4. play() return value when valid texture not set (guess : null)
// 5. stop() affecting only playing nodes, or also paused nodes?
// 6. any method taking an IPlaying that has finished (guess: noop)
// 7. IPlaying and IPlayable interfaces in separate .ts file? (suggestion: Playable.ts)
//
// ANSWERS:
// 1. Yes
// 2. No. Throw new Exception("Texture (${texture}) not found on sprite
// ${this.id}.");
// 3. Yes. Pause on null pointer is noOp. We don't know what will happen at
// runtime.
// 4. Return null if you don't start playing something. Otherwise return the
// IPlaying pointer.
// 5. Stop affects every child node. If a child is specified, it only stops the
// child.
// 6. Correct. Use the metadata start + length > now is noOp.
// 7. The interfaces can exist in util.ts

export interface IPlaying {
  parent : number;  // index to "the heap" managed by the engine (initialize to 0)
  texture : string; // identifies the texture
  id : string;      // internally unique id in the SoundSprite (or VideoSprite) object
  current : number; // point in time when the IPlaying was paused (only updated on state change)
  start : number;   // when the texture started playing
  end : number;     // estimated time when the texture should stop playing
  length : number;  // length of the audio clip
  state : string;   // "playing" | "paused"
}

export interface IPlayable {
  playing : IPlaying[]

  /**
   * Set texture before calling play()
   * @param texture the name of the texture
   */
  setTexture(texture : string) : void;

  /**
   * Play the texture that is current pointed to by setTexture()
   * @param pausedTarget a specific paused node that should resume playing
   * @return a record describing the features of the node that started playing
   */
  play(pausedTarget ?: IPlaying) : IPlaying;

  /**
   * Stop and clean up an playing node
   * @param target the node to stop, or all playing nodes if not given
   */
  stop(target ?: IPlaying) : void;

  /**
   * Pause a playing node, allowing it to be resumed by calling play() later.
   * @param target the node to stop, or all playing nodes if not given
   */
  pause(target ?: IPlaying) : void;
}
