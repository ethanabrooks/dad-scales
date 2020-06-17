declare module "standalone-vexflow-context" {
  import NamedStyles from "react-native/StyleSheet";
  import { Vex } from "./vexflow";

  export const NotoFontPack: { getFont: NamedStyles<Font> };
  export class ReactNativeSVGContext extends Vex.Flow.SVGContext {
    constructor(type: NotoFontPack, type: { width?: number; height?: number });
    constructor(element: HTMLElement);
    svg: SVGElement;
    state: any;
    attributes: any;
    lineWidth: number;
    iePolyfill(): boolean;
    setFont(
      family: string,
      size: number,
      weight?: number | string
    ): Vex.Flow.SVGContext;
    setRawFont(font: string): Vex.Flow.SVGContext;
    setFillStyle(style: string): Vex.Flow.SVGContext;
    setBackgroundFillStyle(style: string): Vex.Flow.SVGContext;
    setStrokeStyle(style: string): Vex.Flow.SVGContext;
    setShadowColor(style: string): Vex.Flow.SVGContext; //inconsistent name: style -> color
    setShadowBlur(blur: string): Vex.Flow.SVGContext;
    setLineWidth(width: number): Vex.Flow.SVGContext;
    setLineDash(dash: string): Vex.Flow.SVGContext;
    setLineCap(cap_type: string): Vex.Flow.SVGContext;
    resize(width: number, height: number): Vex.Flow.SVGContext;
    scale(x: number, y: number): Vex.Flow.SVGContext;
    setViewBox(xMin: number, yMin: number, width: number, height: number): void;
    clear(): void;
    rect(
      x: number,
      y: number,
      width: number,
      height: number
    ): Vex.Flow.SVGContext;
    fillRect(
      x: number,
      y: number,
      width: number,
      height: number
    ): Vex.Flow.SVGContext;
    clearRect(
      x: number,
      y: number,
      width: number,
      height: number
    ): Vex.Flow.SVGContext;
    beginPath(): Vex.Flow.SVGContext;
    moveTo(x: number, y: number): Vex.Flow.SVGContext;
    lineTo(x: number, y: number): Vex.Flow.SVGContext;
    bezierCurveTo(
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      x: number,
      y: number
    ): Vex.Flow.SVGContext;
    quadraticCurveTo(
      x1: number,
      y1: number,
      x: number,
      y: number
    ): Vex.Flow.SVGContext; //inconsistent: x, y -> x2, y2
    arc(
      x: number,
      y: number,
      radius: number,
      startAngle: number,
      endAngle: number,
      antiClockwise: boolean
    ): Vex.Flow.SVGContext;
    closePath(): Vex.Flow.SVGContext;
    glow(): Vex.Flow.SVGContext;
    fill(): Vex.Flow.SVGContext;
    stroke(): Vex.Flow.SVGContext;
    measureText(text: string): SVGRect;
    ieMeasureTextFix(
      bbox: SVGRect,
      text: string
    ): { x: number; y: number; width: number; height: number };
    fillText(text: string, x: number, y: number): Vex.Flow.SVGContext;
    save(): Vex.Flow.SVGContext;
    restore(): Vex.Flow.SVGContext;
    openGroup(): Node;
    closeGroup(): void;
    render(): JSX.Element;
  }
}

declare module "vexflow" {
  export = Vex;
}
