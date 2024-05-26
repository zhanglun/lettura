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

declare interface UserConfig {
  threads?: number;
  color_scheme?: string;
  theme?: string;
  update_interval?: number;
  last_sync_time?: Date;
  proxy?: LocalProxy;
  customize_style?: CustomizeStyle;

  purge_on_days: number;
  purge_unread_articles: boolean;
}
