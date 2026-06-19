import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { MainVideoV3, V3_DURATION } from "./MainVideoV3";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="main"
      component={MainVideo}
      durationInFrames={900}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="v3"
      component={MainVideoV3}
      durationInFrames={V3_DURATION}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);
