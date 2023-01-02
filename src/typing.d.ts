declare module "*.css" {
	const content: { [className: string]: string };
	export default content;
}

declare interface LocalProxy {
	protocol: "";
	ip: string;
	port: string;
}

declare interface UserConfig {
	local_proxy?: LocalProxy;
	threads?: number;
}
