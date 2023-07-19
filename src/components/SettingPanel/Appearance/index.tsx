import React, { useEffect, useState } from "react";
import { Panel, PanelSection } from "../Panel";
import { CustomizeStyle } from "@/components/SettingPanel/CustomizeStyle";
import { useBearStore } from "@/hooks/useBearStore";
import classNames from "classnames";
import { Theme } from "./Theme";
// import { ColorTheme } from "./ColorTheme";

export const Appearance = () => {
  const store = useBearStore((state) => ({
    userConfig: state.userConfig,
    updateUserConfig: state.updateUserConfig,
  }));

  const [previewStyle, setPreviewStyle] = useState({});

  useEffect(() => {
    setPreviewStyle({
      fontSize: "var(--reading-p-font-size)",
      fontFamily: "var(--reading-editable-typeface)",
      lineHeight: "var(--reading-p-line-height)",
    });
  }, [store.userConfig]);

  return (
    <Panel
      title="Appearance"
      subTitle="Customize the appearance of the app. Automatically switch between day and night themes."
    >
      <PanelSection title="Theme" subTitle="Select your interface color scheme">
        <Theme />
      </PanelSection>
      <PanelSection
        title="Style"
        subTitle="Set the view styles you want to use when you are reading."
      >
        <div className="mt-4">
          <CustomizeStyle
            className={"w-[500px]"}
            styleConfig={store.userConfig.customize_style}
          />
        </div>
        <div
          className={classNames(
            "mt-5 rounded-lg border p-4 break-words",
            "reading-content",
          )}
          style={previewStyle}
        >
          <p>
            Stray birds of summer come to my window to sing and fly away. And
            yellow leaves of autumn, which have no songs, flutter and fall there
            with a sign.
          </p>

          <p>
            夏天的飞鸟，飞到我的窗前唱歌，又飞去了。秋天的黄叶，它们没有什么可唱，只叹息一声，飞落在那里。
          </p>

          <p>
            O Troupe of little vagrants of the world, leave your footprints in
            my words.
          </p>

          <p>世界上的一队小小的漂泊者呀，请留下你们的足印在我的文字里。</p>

          <p>
            The world puts off its mask of vastness to its lover.It becomes
            small as one song, as one kiss of the eternal.
          </p>

          <p>
            世界对着它的爱人，把它浩翰的面具揭下了。它变小了，小如一首歌，小如一回永恒的接吻。
          </p>

          <p>It is the tears of the earth that keep here smiles in bloom.</p>

          <p>是大地的泪点，使她的微笑保持着青春不凋谢。</p>

          <p>
            The mighty desert is burning for the love of a blade of grass who
            shakes her head and laughs and flies away.
          </p>

          <p>无垠的沙漠热烈追求一叶绿草的爱，她摇摇头笑着飞开了。</p>

          <p>
            If you shed tears when you miss the sun, you also miss the stars.
          </p>

          <p>如果你因失去了太阳而流泪，那么你也将失去群星了。</p>

          <p>
            The sands in your way beg for your song and your movement, dancing
            water. Will you carry the burden of their lameness?
          </p>

          <p>
            跳舞着的流水呀，在你途中的泥沙，要求你的歌声，你的流动呢。你肯挟瘸足的泥沙而俱下么？
          </p>

          <p>Her wishful face haunts my dreams like the rain at night.</p>

          <p>她的热切的脸，如夜雨似的，搅扰着我的梦魂。</p>

          <p>
            Once we dream that we were strangers.We wake up to find that we were
            dear to each other.
          </p>

          <p>
            有一次，我们梦见大家都是不相识的。我们醒了，却知道我们原是相亲相爱的。
          </p>

          <p>
            Sorrow is hushed into peace in my heart like the evening among the
            silent trees.
          </p>

          <p>忧思在我的心里平静下去，正如暮色降临在寂静的山林中。</p>
        </div>
      </PanelSection>
    </Panel>
  );
};
