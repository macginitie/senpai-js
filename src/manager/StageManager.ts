
import * as eases from "../ease";
import { chain } from "../matrix";
import { IAudio, ISpriteSheet } from "../util";
import {IPlayable, ISoundSpriteSheet} from "../util";
import { IButton, ILoadButtonProps, loadButton } from "../view/Button";
import { ICharacter, ILoadCharacterProps, loadCharacter } from "../view/Character";
import { ICheckbox, ILoadCheckboxProps, loadCheckbox } from "../view/Checkbox";
import { IClose, ILoadCloseProps, loadClose } from "../view/Close";
import { IFontSourceMap, loadFonts } from "../view/fonts";
import { ILabel, ILabelProps, loadLabel } from "../view/Label";
import { ILoadPanelProps, IPanel, loadPanel } from "../view/Panel";
import {ILoadSFXProps, ISFX, ISFXProps, SFXSprite} from "../view/SFXSprite";
import { ILoadSliderProps, ISlider, loadSlider } from "../view/Slider";
import { ISprite } from "../view/Sprite";
import { IStage, IStageProps, Stage } from "../view/Stage";
import { ILoadTextboxProps, ITextbox, loadTextbox } from "../view/Textbox";

export interface ISpriteIndex {
  [id: string]: ISprite;
}

export interface ICharacterImportIndex {
  [name: string]: {
    index?: {
      json: ISpriteSheet;
      [fileType: string]: any;
    };
    [filename: string]: {
      json?: object;
      png?: string;
      [fileType: string]: any;
    };
  };
}

export interface IStageManagerProps extends IStageProps {

}

export interface IStageManager extends IStage {
  createButton(...props: ILoadButtonProps[]): Promise<IButton>;
  createCharacter(...props: ILoadCharacterProps[]): Promise<ICharacter>;
  createCheckbox(...props: ILoadCheckboxProps[]): Promise<ICheckbox>;
  createClose(...props: ILoadCloseProps[]): Promise<IClose>;
  createLabel(...props: ILabelProps[]): Promise<ILabel>;
  createPanel(...props: ILoadPanelProps[]): Promise<IPanel>;
  createSFXSprite(...props: ISFXProps[]): IAudio;
  createSlider(...props: ILoadSliderProps[]): Promise<ISlider>;
  createTextbox(...props: ILoadTextboxProps[]): Promise<ITextbox>;
  loadFonts(): Promise<void>;
}

export interface ISoundImportIndex {
  [name: string]: {
    mp3?: string;
    ogg?: string;
    wav?: string;
    flac?: string;
    json?: ISoundSpriteSheet;
  };
}

export interface IPosition {
  x?: number;
  y?: number;
  sx?: number;
  sy?: number;
  cx?: number;
  cy?: number;
  r?: number;
  a?: number;
  z?: number;
  animationLength?: number;
  ease?: string;
  wait: number;
}

export class StageManager extends Stage implements IStageManager {
  private static ButtonSpritesheet: ISpriteSheet = require("../../assets/button/index.json");
  private static ButtonImages: string =  require("../../assets/button/spritesheet.png");
  private static Characters: ICharacterImportIndex = require("../../assets/characters/*/*.*");
  private static CheckboxSpritesheet: ISpriteSheet = require("../../assets/checkbox/index.json");
  private static CheckboxImages: string = require("../../assets/checkbox/spritesheet.png");
  private static CloseImages: string = require("../../assets/close/spritesheet.png");
  private static CloseSpritesheet: ISpriteSheet = require("../../assets/close/index.json");
  private static PanelSpritesheet: ISpriteSheet = require("../../assets/panel/index.json");
  private static PanelImages: string = require("../../assets/panel/spritesheet.png");
  private static SliderSpritesheet: ISpriteSheet = require("../../assets/slider/index.json");
  private static SliderImages: string = require("../../assets/slider/spritesheet.png");
  private static TextboxSpritesheet: ISpriteSheet = require("../../assets/textbox/index.json");
  private static TextboxImages: string = require("../../assets/textbox/spritesheet.png");
  private static SoundsImports: ISoundImportIndex = require("../../assets/sound/*.*");

  constructor(props: IStageManagerProps) {
    super(props);
    Object.defineProperty(window, "sm", {
      configurable: false,
      enumerable: false,
      value: this,
      writable: false,
    });
  }

  public createButton(...props: ILoadButtonProps[]): Promise<IButton> {
    const options: ILoadButtonProps = Object.assign({}, ...props);
    options.definition = StageManager.ButtonSpritesheet;
    options.src = StageManager.ButtonImages;
    return loadButton(options);
  }

  public createCharacter(...props: ILoadCharacterProps[]): Promise<ICharacter> {
    const options: ILoadCharacterProps = Object.assign({}, ...props);
    options.definition = StageManager.Characters[options.name].index.json;
    options.src = StageManager.Characters[options.name].spritesheet.png;
    return loadCharacter(options);
  }

  public createCheckbox(...props: ILoadCheckboxProps[]): Promise<ICheckbox> {
    const options: ILoadCheckboxProps = Object.assign({}, ...props);
    options.definition = StageManager.CheckboxSpritesheet;
    options.src = StageManager.CheckboxImages;
    return loadCheckbox(options);
  }

  public createClose(...props: ILoadCloseProps[]): Promise<IClose> {
    const options: ILoadCloseProps = Object.assign({}, ...props);
    options.definition = StageManager.CloseSpritesheet;
    options.src = StageManager.CloseImages;
    return loadClose(options);
  }

  public createLabel(...props: ILabelProps[]): Promise<ILabel> {
    const options: ILabelProps = Object.assign({}, ...props);
    return loadLabel(options);
  }

  public createPanel(...props: ILoadPanelProps[]): Promise<IPanel> {
    const options: ILoadPanelProps = Object.assign({}, ...props);
    options.definition = StageManager.PanelSpritesheet;
    options.src = StageManager.PanelImages;
    return loadPanel(options);
  }

  public createSlider(...props: ILoadSliderProps[]): Promise<ISlider> {
    const options: ILoadSliderProps = Object.assign({}, ...props);
    options.definition = StageManager.SliderSpritesheet;
    options.src = StageManager.SliderImages;
    return loadSlider(options);
  }

  public createSFXSprite(...props: ISFXProps[]): IAudio {
    const options: ISFXProps = Object.assign({}, ...props);
    const soundImport = StageManager.SoundsImports[options.name];
    options.definition = soundImport.json; // definition
    options.source = fetch(soundImport.mp3
      || soundImport.ogg
      || soundImport.wav
      || soundImport.flac);
    return new SFXSprite(options);
  }

  public createTextbox(...props: ILoadTextboxProps[]): Promise<ITextbox> {
    const options: ILoadTextboxProps = Object.assign({}, ...props);
    options.definition = StageManager.TextboxSpritesheet;
    options.src = StageManager.TextboxImages;
    return loadTextbox(options);
  }

  public loadFonts(): Promise<void> {

    return loadFonts(require("../../assets/fonts/*.*") as IFontSourceMap);
  }
}
