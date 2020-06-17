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
    justifyContent: "space-evenly",
    flex: 3,
    width: "100%"
  },
  music: {
    flex: 2,
    width: "100%",
    justifyContent: "space-around",
    alignItems: "center"
  },
  svg: {
    height: "100%",
    width: "95%"
  },
  toggles: {
    flex: 1,
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-evenly",
    alignItems: "center"
  },

  button: {
    flex: 1,
    height: "100%"
  },
  switch: {
    height: "100%",
    width: 150,
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center"
  }
});
