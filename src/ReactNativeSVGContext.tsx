import React from "react";
import { SVGContext } from "vexflow/src/svgcontext";
import Svg, { G, Path, Rect } from "react-native-svg";

const SvgClass = {
  svg: Svg,
  path: Path,
  rect: Rect,
  g: G
};

type Element = {
  appendChild: (elem: unknown) => void;
  setAttribute: () => void;
  children: any[];
  svgElementType: unknown;
  style: {};
  props: { style: {} };
};

type Attribute = {
  "font-weight": string;
  x: number;
  "font-size": string;
  y: number;
  "stroke-dasharray": string;
  "font-family": string;
  "stroke-width": number;
  "font-style": string;
  fill: string;
  stroke: string;
};

export class ReactNativeSVGContext extends SVGContext {
  static create(svgElementType: unknown): Element {
    return {
      style: {},
      setAttribute: function() {},
      appendChild: function(elem: unknown) {
        (this.children as unknown[]).push(elem);
      },
      children: [],
      svgElementType,
      props: {
        style: {}
      }
    };
  }

  constructor({ width = 300, height = 300 }) {
    super(ReactNativeSVGContext.create("div"), "div");
    this.svg.props.width = width;
    this.svg.props.height = height;
  }

  create(svgElementType: unknown) {
    return ReactNativeSVGContext.create(svgElementType);
  }

  applyAttributes(element: Element, attributes: Attribute[]) {
    for (const propertyName in attributes) {
      let _propertyName = propertyName.replace(/-([a-z])/g, function(g) {
        return g[1].toUpperCase();
      });
      element.props[_propertyName] = attributes[propertyName];
    }
  }

  createReactElement(element) {
    const children = [];

    for (var i = 0; i < element.children.length; i++) {
      children.push(this.createReactElement(element.children[i]));
    }

    if (element.svgElementType === "path") {
      delete element.props["x"];
      delete element.props["y"];
    }

    return React.createElement(
      SvgClass[element.svgElementType],
      element.props,
      children
    );
  }

  render() {
    return this.createReactElement(this.svg);
  }
}
