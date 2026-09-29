declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}

declare interface LocalProxy {
  protocol: string;
  server: string;
  port: string;
  username?: string;
  password?: string;
  is_global?: boolean;
  enable?: boolean;
}

declare type ProxyRule = string[];

declare interface CustomizeStyle {
  typeface: string;
  font_size: number;
  line_height: number;
  line_width: number;
}

declare type ThemeAccentColor =
  | "default"
  | "custom"
  | "gray"
  | "gold"
  | "bronze"
  | "brown"
  | "yellow"
  | "amber"
  | "orange"
  | "tomato"
  | "red"
  | "ruby"
  | "crimson"
  | "pink"
  | "plum"
  | "purple"
  | "violet"
  | "iris"
  | "indigo"
  | "blue"
  | "cyan"
  | "teal"
  | "jade"
  | "green"
  | "grass"
  | "lime"
  | "mint"
  | "sky";

declare type AppConfig = {};

declare interface UserConfig {
  port?: number;
  threads?: number;
  color_scheme?: string;
  theme?: ThemeAccentColor;
  update_interval?: number;
  last_sync_time?: Date;
  proxy?: LocalProxy;
  customize_style?: CustomizeStyle;
  app?: AppConfig;

  purge_on_days: number;
  purge_unread_articles: boolean;

  launch_at_login?: boolean;
  background_sync?: boolean;
  cache_retention_days?: number;
  data_retention_days?: number;
  reader_preset?: string;
  card_density?: string;
  /** 强调色（indigo/moss/ochre/brick/vine），令牌层 color-mix 派生 */
  /** Astryx 组件主题 slug（默认 neutral） */
  astryx_theme?: string;

  /** 自定义生成路由，一行一条：`匹配 => 路由`（详见 settings 帮助文字） */
  generator_routes?: string[];

  /** 外部桥接实例（自建 RSSHub/Nitter）；订阅探测失败时对无协议路径重试 `实例/路径` */
  bridge_instance?: string;
}
