import { Sprite, ISprite, ISpriteProps } from "./Sprite";
import { IInteractionPoint, loadImage, ITextureMap, ISpriteSheet } from "../util";
import * as Matrix from "../matrix";

const assert = require("assert");

export interface ISlider extends ISprite {
  value: number;
  max: number;
  min: number;
  width: number;
};

export interface ISliderProps extends ISpriteProps {
  value?: number;
  max?: number;
  min?: number;
  width: number;
}

export class Slider extends Sprite implements ISlider {
  value: number = 0;
  max: number = 1;
  min: number = 0;
  width: number = 100;
  private sliderPattern: CanvasPattern = null;
  private pillTexture: ImageBitmap = null;

  constructor(props: ISliderProps) {
    super(props);

    this.height = props.textures.Pill_Hover.height;
    this.width = props.width;
    this.max = props.max || this.max;
    this.min = props.min || this.min;
    this.value = props.value || this.value;
    
    this.sliderPattern = document
      .createElement("canvas")
      .getContext("2d")
      .createPattern(props.textures.Line, "repeat-x");
  }
  broadPhase(point: IInteractionPoint): boolean {
    if (this.active) {
      return true;
    }
    return super.broadPhase(point);
  }
  narrowPhase(point: IInteractionPoint): boolean {
    if (this.active) {
      return true;
    }
    const sliderDistance = this.width - this.textures.Pill_Hover.width;
    const sliderValuePercent = (this.value - this.min) / (this.max - this.min);
    const valueX = sliderDistance * sliderValuePercent;

    return point.ty <= this.textures.Pill_Hover.height
      && point.ty >= 0
      && point.tx >= valueX
      && point.tx <= valueX + this.textures.Pill_Hover.width;
  }
  pointCollision(point: IInteractionPoint): boolean {
    super.pointCollision(point);
    if (this.active && point.active === this) {
      const previousValue = this.value;
      const sliderDistance = this.width - this.textures.Pill_Hover.width;
      const trueTX = point.tx - this.textures.Pill_Hover.width * 0.5;
      const clampedTX = Math.max(0, Math.min(trueTX, sliderDistance));
      const range = this.max - this.min;
      this.value = this.min + range * clampedTX / sliderDistance;
      if (this.value !== previousValue) {
        super.emit("value-change", this);
      }
    }

    return true;
  }
  update(): void {
    this.cursor = this.hover ? "pointer" : "default";
    this.pillTexture = this.active
      ? this.textures.Pill_Active
      : (this.hover ? this.textures.Pill_Hover : this.textures.Pill);
  }
  render(ctx: CanvasRenderingContext2D): void {
    ctx.drawImage(this.textures.Line_Cap_Left, 0, 0);
    ctx.drawImage(
      this.textures.Line_Cap_Right,
      this.width - this.textures.Line_Cap_Right.width,
      0,
    );
    ctx.fillStyle = this.sliderPattern;
    ctx.fillRect(
      this.textures.Line_Cap_Left.width,
      0,
      this.width - this.textures.Line_Cap_Left.width - this.textures.Line_Cap_Right.width,
      this.textures.Line.height,
    );
    const sliderDistance = this.width - this.textures.Pill_Hover.width;
    const sliderValuePercent = (this.value - this.min) / (this.max - this.min);
    const valueX = sliderDistance * sliderValuePercent;

    ctx.drawImage(this.pillTexture, valueX, 0);
  }
}

export async function loadSlider(id: string, src: string, definition: ISpriteSheet): Promise<ISlider> {
  const img = loadImage(src);
  const textures: ITextureMap = {};

  await Promise.all(
    Object.entries(definition.frames).map(async function([desc, state], i) {
      textures[desc] = await createImageBitmap(
        await img,
        state.frame.x,
        state.frame.y,
        state.frame.w,
        state.frame.h,
      );
    })
  );
  assert(textures.Line_Cap_Left);
  assert(textures.Line_Cap_Right);
  assert(textures.Line);
  assert(textures.Pill);
  assert(textures.Pill_Active);
  assert(textures.Pill_Hover);
  
  const slider = new Slider({
    id,
    textures,
    position:  Matrix.Identity,
    width: 100
  });
  
  return slider;
};