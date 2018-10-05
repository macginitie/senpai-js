# Architecture

## `./script`

This folder contains all the downstream developer generated content for game scripts that run inside the engine. The proposal so far for script files will support the following file types:

- `.md` (Markdown files)
- `.js`, `.ts`, `.coffee`,  (things that transform into JavaScript inside parcel)
- `.json`, `.yaml`, (static file formats)
- `.aml` (`archieml` possibly)
- `.senpai` (a domain specific language that compiles to a `.js` file state machine)

## `./src`

This folder contains all the source for the engine

### `./src/ease`

This folder contains an `index.ts` file for all the ease functions. Props to `b-fuze` for helping increase ease precision. Ease functions have a typescript signature like this:

```ts
type EaseFunction = (value: number /* range: [0-100] */) => number; /* range: [0-100] */
```

The `value` parameter is a `Float` ratio that represents the linear length of time that has passed relative to how long the animation needs to take. For instance, if the animation just started, `value` should be `0`. If the animation has completed, it should return `100`.  A quadratic ease function would return a `value` distribution that is curved quadratically.

### `./src/manager`

This folder contains a class that has knowledge of how the project is structured, how sprites are setup, and works with the `Stage` class in the `./src/view` folder. It's sole responsibility is to create `Sprite`s and `SoundSprites`.

### `./src/matrix`

This folder contains a whole framework for modifying 2d transforms. Each function accepts either a `Float64Array` or `number[]` of length 6, and the numbers map to the following matrix elements. `[aa, ab, ba, bb, ca, cb]` See the following matrix representation for mapping.

![Matrix Map](https://cdn.pbrd.co/images/HvnXB9x.png)

It contains a `chain(value: Float64Array|number[], immutable: boolean = false): IMatrix` function for chaining purposes.  If `immutable` is set to true, it will not modify the original matrix inline, and return a new `IMatrix` each time you chain a function.

### `./src/util`

This folder contains a bunch of utility interfaces and classes. A lot of the utility interfaces that exist in the `./src/view` folder might be better placed in their own files inside this folder.

### `./src/view`

This folder contains a set of controls that are used for drawing things to the canvas.

#### `./src/view/Container.ts`

This file is the simple sprite and soundSprite container required for updating and rendering sprites, and stores the `AudioContext` used for playing music. It inherits the `EventEmitter` class for event purposes.

#### `./src/view/Sprite.ts`

This is a parent class that is the basis for all sprites. It contains default drawing and collision logic for `IInteractionPoint` movement.

Notes on collision detection for sprites:

- `sprite.inverse` is calculated in the `interpolate(now: number)` function, and that happens once every time the sprite moves
- `inverse` is used to transform the mouse points toward the `ISprite`'s relative position. Imagine if we perform collision detection but the sprite is actually regularly shaped, and at `[0, 0]`

Each function performs the following operations:

- `ease`: an `EaseFunction` that controls the animation rate. See `./src/ease/index.ts`
- `broadPhase`: simple `aabb` collision detection. It uses the `tx` and `ty` properties and compares them to the `width` and `height` of the control
- narrowPhase: returns `true` unless it's overridden by a child class
- `isHovering`: used by the `StageInteractionManager` to determine if the `point` is over the sprite
- `move`: sets the `previousPosition` array and sets the `position` array to the provided `position` parameter
- `setAlpha`: sets the `previousAlpha` to the current `alpha` value, then sets the `alpha` value to the provided `alpha` parameter
- `setZ`: sets the `z` index value.
- `over`: modifies all the animation properties.
  - `timespan`: length of animation in milliseconds
  - `wait`: length to time to wait in milliseconds
  - `ease`: easeFunction to use
- `skipAnimation`: sets the `animationStart` property to `Date.now()` to skip the animation. It returns true if it actually skipped the animation
- `update`: This is a no-op unless modified by a child class
- `interpolate`: This function calculates:
  - `interpolatedPosition` matrix property (onscreen position)
  - `inverse` matrix property
  - `parent.inverse` matrix property (if there's a parent)
  - if there is a parent inverse, it's calculated with `parent.inverse * sprite.inverse`
- `setTexture`: the function that sets the current texture of the sprite
- `render`: draws the current texture of the sprite at `[0, 0]`
  - `Stage` calls `ctx.setTransform(...sprite.position);` first

The following are properties on sprites:

- `active`: This property describes when a point has "captured" a control for input. When the mouse clicks down over a button, it will set the button's `active` property to `true`. This is intended to cause the button to look like it's actively being pressed.
- `hover`: This property is set to true when an uncaptured interaction point is over the sprite
- `texture`: This property is something drawable by the `ctx.drawImage()` function. Can be a video, `ImageBitmap`, canvas, `OffscreenCanvas`, ... etc  
- `z`: This property is the z index of the sprite. The `Stage` update function will sort the sprites by `z` before performing collision detection.
- `alpha`: This property sets/multiplies the `globalAlpha` value. See [global alpha](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalAlpha).
- `previousAlpha`: This property is previous `alpha` value before the sprite `move`ed
- `position`: This is a `Float64Array` that describes the linear transform of the target position a sprite will animate to when it `move`s.
- `interpolatedPosition`: This is the linear transform of the sprite that describes it's current position. It is also used in collision detection.
- `previousPosition`: This is the previous `interpolatedPosition` of the sprite after it was `move`ed. It is used as the starting value of the current moving animation. 
- `lastInterpolated`: This property is used to describe the timestamp of the last time the sprite's position was calculated. This is required because sometimes a child's interpolatedPosition depends on it's parent's position, and the parent must be updated to the current timestamp.
- `animationStart`: This is the timestamp of the animation start time. Used in animation.
- `animationLength`: This is the length in milliseconds of the animation timespan. Used in animation.
- `wait`: This is the length of time the animation will wait before beginning.
- `easeFunc`: This is the ease function that describes the ratio distribution of how a sprite moves with animation.
- `parent`: This is the pointer to the container or stage the sprite currently sits inside.
- `cursor`: This property should be set to `"pointer"` inside the `update()` function definition whenever user interaction will affect it's state when the sprite is clicked.

The following events are emitted for every sprite regardless of what kind:

- `"point-move"`: This event is emitted when an interaction point is hovering over the sprite.
- `"click"`: This event is emitted when the sprite was "active", and the "up" event occurs while the interaction point is hovering over it.
- `"down"`: This event is emmited when an interaction point transitions to the "down" state.
- `"up"`: This event is emmited when an interaction point transitions to the "up" state after the point was "down".

#### `./src/view/Button.ts`

This class extends the `Sprite` class and implements `IButton`. The `StageManager` uses `loadButton` to asynchronously load the button textures.

It overrides the standard update function calls to set the texture state, and set the `cursor` property to `"pointer"` if it detects a `hover` from the `InteractionManager`.

```ts
class Button extends Sprite implements IButton {
  public update(): void {
    const active = this.active ? "Active" : "Inactive";
    const hover = this.hover ? "Hover" : "NoHover";
    const selected = this.selected ? "Selected" : "Unselected";
    this.setTexture(`${active}_${hover}_${selected}`);

    this.cursor = this.hover ? "pointer" : "default";
    super.update();
  }
}
```

Rendering on a `Button` is overridden too, because buttons have text. They are typically drawn in the absolute center of the button with the provided `fontSize` property and `font` property. These properties can be overwritten.

The following events are emitted for buttons:

- "click": happens when the button is clicked

#### `./src/view/Character.ts`

This class extends the `Sprite` class and implements `ICharacter`.

It's essentially the same thing as a `Sprite` with a few extra properties, including `color`, `displayName`, and `name`.

- `name`: string used to identify the folder that the sprite sheet exists in.
- `displayName`: the string that shows the character's name when they speak.
- `color`: the color of the display name

#### `./src/view/Checkbox.ts`

This class extends the `Sprite` class and implements `ICheckbox`.

This sprite type is designed to be a button with a label next to it that fundamentally has a `checked` and `unchecked` state.

The texture of the checkbox becomes the bounds for a `Button` that emits a `toggle` event whenever the state of the checkbox changes.

It overrides the `update` method and the sprite definition requires states that match the following states:

```ts
class CheckBox extends Sprite implements ICheckbox {
  public update(): void {
    const active = this.active ? "Active" : "Inactive";
    const hover = this.hover ? "Hover" : "NoHover";
    const checked = this.checked ? "Checked" : "Unchecked";
    this.setTexture(`${active}_${hover}_${checked}`);

    this.cursor = this.hover ? "pointer" : "default";
    super.update();
  }
}
```

#### `./src/view/Close.ts`

This is a button sprite definition without the `selected` property, and a slightly modified `update()` function.

```ts
export class Close extends Sprite implements IClose {
  constructor(props: ICloseProps) {
    super(props);
  }
  public update(): void {
    const active = this.active ? "Active" : "Inactive";
    const hover = this.hover ? "Hover" : "NoHover";
    this.setTexture(`${active}_${hover}`);

    this.cursor = this.hover ? "pointer" : "default";
    super.update();
  }
}
```

#### `./src/view/Panel.ts`

This is the most complicated sprite. It is essentially a container that can contain any number of child sprites. The `setTexture()` method must be called on it immediately or it will not be drawable.

It's purpose is to draw children sprites relative to the current position of the panel. In fact, hovering detection is actually deferred to it's children. `narrowPhase()` collision detection actually loops over the children, transforming the `IInteractionPoint` in question relative to the position of the sprite in the cointainer. If it detects a hover, `narrowPhase()` will actually return the `child` instead of itself. This allows hovering detection on sprites inside multiple nested panels. If no `narrowPhase()` collision detection is found, it will return itself.

`render()`ing a panel will render all of it's children, handling `.transform`s relative to the panel's current `interpolatedPosition` automatically. The children will be rendered in a `.clip()`ed region. Please see [mdn clip](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/clip) if this is unclear.

`update()`ing a panel will `update()` all of it's children, modifying itself to be hovering if a child is hovered to enable `cursor: "pointer"` functionality.

#### `./src/view/fonts.ts`

This function loads all the specified fonts. It's configured in `./src/manager/StageManager.ts`.

#### `./src/view/Label.ts`

This sprite has no texture. It simply draws text with the provided properties at the `interpolatedPosition`.

```ts
export interface ILabelProps extends ISpriteProps {
  text?: string;
  font?: string;
  fontSize?: number;
  fontColor?: string;
  textAlign: TextAlign;
  textBaseline: TextBaseline;
}
```

The `fontColor` property is actually the `ctx.fillStyle` property, and it will be possible to create `CanvasGradient`s and use them as the `fillStyle` for drawing the text. This will be supported later.

The `font` property is calculated with the following string:

```ts
`${this.font} ${this.fontSize}px`;
```

All the rest of these properties directly map to values on the `CanvasRenderingContext2D.prototype`. Please visit [mdn](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D) to learn about these properties.
