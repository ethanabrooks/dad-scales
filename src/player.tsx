import { View } from "react-native";
import React from "react";
import { Sampler } from "tone";

export const Player: React.FC = A1 => {
  const [isLoaded, setLoaded] = React.useState(false);
  const sampler: React.MutableRefObject<Sampler> = React.useRef(null);

  React.useEffect(() => {
    sampler.current = new Sampler(
      { A1 },
      {
        onload: () => {
          setLoaded(true);
        }
      }
    ).toMaster();
  }, []);

  return (
    <View>
      <button
        disabled={!isLoaded}
        onClick={() => sampler.current.triggerAttack("A1")}
      >
        start
      </button>
    </View>
  );
};
