declare module "gtfs-rt-bindings" {
	import { FeedMessage as FmType } from "gtfs-types";
	interface FeedMessage {
		decode: (buf: Uint8Array) => FmType;
	}
	export const FeedMessage: FeedMessage;
}
