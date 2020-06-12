import React from "react";
import { Button, Picker, StyleSheet, Text, View } from "react-native";
import { Map } from "immutable";
import patterns from "./patterns.json";

type Pattern = { pattern: number[]; sharp: string[] };
type Root = number;
type State =
  | { type: "selectPattern" }
  | { type: "selectRoot"; pattern: Pattern }
  | { type: "display"; pattern: Pattern; root: Root };

export default function App() {
  const [state, setState] = React.useState<State>({ type: "selectPattern" });
  switch (state.type) {
    case "selectPattern":
      const scalePatterns: Map<string, Pattern> = Map(patterns);
      const firstPattern: null | Pattern = scalePatterns
        .valueSeq()
        .first<null>();
      if (!firstPattern) {
        return <Text>"patterns.json is empty"</Text>;
      } else {
        const [pattern, setPattern] = React.useState<Pattern>(firstPattern);
        return (
          <View style={styles.container}>
            <Picker
              selectedValue={pattern}
              style={styles.picker}
              onValueChange={(value, itemIndex) => setPattern(value)}
            >
              {scalePatterns
                .toSeq()
                .map((p, n) => (
                  <Picker.Item label={n} value={firstPattern} key={n} />
                ))
                .valueSeq()
                .toArray()}
            </Picker>
            <Button
              title="Select Scale"
              onPress={() => setState({ type: "selectRoot", pattern: pattern })}
            />
          </View>
        );
      }
    case "selectRoot":
      const [root, setRoot] = React.useState<string>("A");
      return (
        <View style={styles.container}>
          <Picker
            selectedValue={root}
            style={styles.picker}
            onValueChange={(value, itemIndex) => setRoot(value)}
          >
            <Picker.Item label={"A"} value={"A"} key={"A"} />
          </Picker>
          {
            <Button
              title="Select Scale"
              onPress={() =>
                setState({
                  type: "display",
                  pattern: state.pattern,
                  root: 0
                })
              }
            />
          }
        </View>
      );
    case "display":
      break;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-around"
  },
  picker: {
    height: 150,
    width: 150
  },
  buttonStyle: {
    alignSelf: "center"
  }
});
