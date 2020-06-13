import React, { Component } from "react";
import { Image, ScrollView, StatusBar, StyleSheet, View } from "react-native";

import Canvas, { ImageData } from "react-native-canvas";

const Example = ({ sample, children }) => (
  <View style={styles.example}>
    <View style={styles.exampleLeft}>{children}</View>
    <View style={styles.exampleRight}>
      <Image source={sample} style={{ width: 100, height: 100 }} />
    </View>
  </View>
);

export default class App extends Component {
  handleImageData(canvas: Canvas) {
    canvas.width = 100;
    canvas.height = 100;

    const context = canvas.getContext("2d");
    context.fillStyle = "purple";
    context.fillRect(0, 0, 100, 100);
    context.getImageData(0, 0, 100, 100).then(imageData => {
      const data = Object.values(imageData.data);
      const length = Object.keys(data).length;
      for (let i = 0; i < length; i += 4) {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
      }
      const imgData = new ImageData(canvas, data, 100, 100);
      context.putImageData(imgData, 0, 0);
    });
  }
  render() {
    return (
      <View style={styles.container}>
        <StatusBar hidden={true} />
        <ScrollView style={styles.examples}>
          <View style={styles.example}>
            <View style={styles.exampleLeft}>{this.handleImageData}</View>
            <View style={styles.exampleRight}>
              <Image
                source={require("./images/purple-black-rect.png")}
                style={{ width: 100, height: 100 }}
              />
            </View>
          </View>
          <Example sample={require("./images/purple-black-rect.png")}>
            <Canvas ref={this.handleImageData} />
          </Example>
        </ScrollView>
      </View>
    );
  }
}

const commonStyles = StyleSheet.create({
  full: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%"
  },
  cell: {
    flex: 1,
    padding: 10,
    justifyContent: "center",
    alignItems: "center"
  }
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    ...commonStyles.full
  },
  examples: {
    ...commonStyles.full,
    padding: 5,
    paddingBottom: 0
  },
  example: {
    paddingBottom: 5,
    flex: 1,
    flexDirection: "row"
  },
  exampleLeft: {
    ...commonStyles.cell
  },
  exampleRight: {
    ...commonStyles.cell
  }
});
