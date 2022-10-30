declare module '*.css' {
    const content: { [className: string]: string };
    export default content;
}

declare interface LocalProxy {
  ip: string,
  port: string,
}

declare interface UserConfig {
  local_proxy?: LocalProxy,
}
