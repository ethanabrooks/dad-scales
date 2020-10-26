import React from "react";
import { Button, Picker, Text, TouchableOpacity, View } from "react-native";
import { NUM_TONES, Tone, toneStrings } from "./note";
import "./Scales";
import { scales } from "./Scales";
import { styles } from "./styles";

type Scale = number[];

function modCumSum(
  { acc, prev }: { acc: number[]; prev: number },
  curr: number
) {
  const sum: number = prev + curr;
  return { acc: acc.concat(sum % NUM_TONES), prev: sum };
}

function randomNumber(n: number): number {
  return Math.floor(Math.random() * n);
}

function randomRoot(): string {
  let tone = toneStrings[randomNumber(NUM_TONES)];
  return Math.random() ? tone.sharp : tone.flat;
}

function randomScale(): Scale {
  let scale = scales[randomNumber(scales.length)];
  let rotation = randomNumber(NUM_TONES);
  return scale.slice(rotation, scale.length).concat(scale.slice(0, rotation));
}

export default function App(): JSX.Element {
  const [scale, setScale] = React.useState<Scale>(scales[0]);
  const [root, setRoot] = React.useState<number>(0);

  const scaleButton: JSX.Element = (
    <Button title={"Randomize Scale"} onPress={() => setScale(randomScale())} />
  );

  const rootButton: JSX.Element = (
    <Button
      title={"Randomize Root"}
      onPress={() => setRoot(randomNumber(NUM_TONES))}
    />
  );

  const rootPicker: JSX.Element = (
    <Picker
      style={{ backgroundColor: "white", ...styles.picker }}
      selectedValue={root}
      onValueChange={setRoot}
    >
      {toneStrings
        .map((t) => t.sharp)
        .map((r) => (
          <Picker.Item label={r} value={r} key={r} />
        ))}
    </Picker>
  );

  const scaleIndices: number[] = scale.reduce(
    (soFar: number[], n: number) => {
      return soFar.concat((soFar[soFar.length - 1] + n) % NUM_TONES);
    },
    [root]
  );
  console.log("root", root);
  console.log("scaledIndices", scaleIndices);
  const width = 250;
  const necklace = (
    <View
      style={{
        flex: 1,
        width: width,
      }}
    >
      {toneStrings.map((t: Tone, i: number) => {
        const theta = (2 * Math.PI * i) / NUM_TONES;
        const diameter = width / 6;
        const left = (width * (1 + Math.cos(theta)) - diameter) / 2;
        const top = (width * (1 + Math.sin(theta))) / 2;
        const color = scaleIndices.includes(i) ? "black" : "lightgrey";
        return (
          <TouchableOpacity
            style={{
              width: diameter,
              height: diameter,
              position: "absolute",
              left: left,
              top: top,
              backgroundColor: color,
              borderRadius: 50,
              alignItems: "center",
              justifyContent: "center",
            }}
            onPress={() => {
              setRoot(i);
              setScale(scales[randomNumber(scales.length)]);
              console.warn("hello");
            }}
          >
            <Text style={{ color: "white" }}>{t.sharp}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.button}>{rootButton}</View>
      <View style={styles.necklace}>{necklace}</View>
    </View>
  );
}
