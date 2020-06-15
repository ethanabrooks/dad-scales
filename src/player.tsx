import { View } from "react-native";
import React from "react";
import { Sampler } from "tone";
import * as O from "fp-ts/lib/Option";
import { pipe } from "fp-ts/lib/function";
import { Option } from "fp-ts/lib/Option";

export const Player: React.FC<{ A1: string }> = ({
  A1
}): null | JSX.Element => {
  const [isLoaded, setLoaded] = React.useState(false);
  const sampler: React.MutableRefObject<null | Sampler> = React.useRef(null);

  React.useEffect(() => {
    sampler.current = new Sampler(A1, {
      onload: () => {
        setLoaded(true);
      }
    }).toMaster();
  }, []);

  return pipe(
    O.fromNullable(sampler.current),
    O.fold(
      () => null,
      current => (
        <View>
          <button
            disabled={!isLoaded}
            onClick={() => current.triggerAttack("A1")}
          >
            start
          </button>
        </View>
      )
    )
  );
};
