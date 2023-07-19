declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}

declare interface LocalProxy {
  protocol: "";
  ip: string;
  port: string;
}

declare interface CustomizeStyle {
  typeface: string;
  font_size: number;
  line_height: number;
  line_width: number;
}

declare interface UserConfig {
  threads?: number;
  theme?: string;
  update_interval?: number;
  local_proxy?: LocalProxy;
  customize_style?: CustomizeStyle;
}
