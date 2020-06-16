import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "space-around"
  },
  error: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%"
  },
  picker: {
    height: "50%"
  },
  pickers: {
    justifyContent: "space-evenly",
    flex: 1 + Math.sqrt(5),
    width: "100%"
  },
  music: {
    flex: 1,
    width: "95%",
    justifyContent: "flex-start",
    alignItems: "center"
  },
  svg: {},

  button: {
    flex: 1,
    height: 50,
    width: 50,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "yellow"
  },
  buttonView: {
    flex: 4,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "blue"
  }
});
