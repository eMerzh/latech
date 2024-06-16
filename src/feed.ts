import { FeedMessage } from "gtfs-rt-bindings";

export const fetchFeed = async (url: string) => {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			const error = new Error(`${response.url}: ${response.status} ${response.statusText}`);
			throw error;
		}

		const buf = await response.arrayBuffer();
		const data = FeedMessage.decode(new Uint8Array(buf));
		return data.entity;
	} catch (error) {
		console.log(error);
	}
	return null;
};
