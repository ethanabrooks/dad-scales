declare module "standalone-vexflow-context" {
  import { StyleSheet } from "react-native";
  import NamedStyles = StyleSheet.NamedStyles;

  export const NotoFontPack: { getFont: NamedStyles<Font> };
  export class ReactNativeSVGContext extends SVGContext {
    constructor(type: NotoFontPack, type: NamedStyles<Svg>);
    constructor(element: HTMLElement);
    svg: SVGElement;
    state: any;
    attributes: any;
    lineWidth: number;
    iePolyfill(): boolean;
    setFont(family: string, size: number, weight?: number | string): SVGContext;
    setRawFont(font: string): SVGContext;
    setFillStyle(style: string): SVGContext;
    setBackgroundFillStyle(style: string): SVGContext;
    setStrokeStyle(style: string): SVGContext;
    setShadowColor(style: string): SVGContext; //inconsistent name: style -> color
    setShadowBlur(blur: string): SVGContext;
    setLineWidth(width: number): SVGContext;
    setLineDash(dash: string): SVGContext;
    setLineCap(cap_type: string): SVGContext;
    resize(width: number, height: number): SVGContext;
    scale(x: number, y: number): SVGContext;
    setViewBox(xMin: number, yMin: number, width: number, height: number): void;
    clear(): void;
    rect(x: number, y: number, width: number, height: number): SVGContext;
    fillRect(x: number, y: number, width: number, height: number): SVGContext;
    clearRect(x: number, y: number, width: number, height: number): SVGContext;
    beginPath(): SVGContext;
    moveTo(x: number, y: number): SVGContext;
    lineTo(x: number, y: number): SVGContext;
    bezierCurveTo(
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      x: number,
      y: number
    ): SVGContext;
    quadraticCurveTo(x1: number, y1: number, x: number, y: number): SVGContext; //inconsistent: x, y -> x2, y2
    arc(
      x: number,
      y: number,
      radius: number,
      startAngle: number,
      endAngle: number,
      antiClockwise: boolean
    ): SVGContext;
    closePath(): SVGContext;
    glow(): SVGContext;
    fill(): SVGContext;
    stroke(): SVGContext;
    measureText(text: string): SVGRect;
    ieMeasureTextFix(
      bbox: SVGRect,
      text: string
    ): { x: number; y: number; width: number; height: number };
    fillText(text: string, x: number, y: number): SVGContext;
    save(): SVGContext;
    restore(): SVGContext;
    openGroup(): Node;
    closeGroup(): void;
    render(): JSX.Element;
  }
}
declare module "tone" {
  export class Sampler {
    constructor(dir: string, file: string);
  }
}

declare module "vexflow" {
  export = Vex;
}
