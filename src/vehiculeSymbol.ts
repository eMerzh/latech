import { Map as MapItem, StyleImageInterface } from "maplibre-gl";

interface SymbolType extends StyleImageInterface {
	context: CanvasRenderingContext2D | null;
}

// implementation of StyleImageInterface to draw a pulsing dot icon on the map
// Search for StyleImageInterface in https://maplibre.org/maplibre-gl-js/docs/API/
export const getVehiculeSymbol = (size: number, map: MapItem, highlight: boolean) => {
	const symbol: SymbolType = {
		width: size,
		height: size,
		data: new Uint8Array(size * size * 4),
		context: null,
		// get rendering context for the map canvas when layer is added to the map
		onAdd() {
			const canvas = document.createElement("canvas");
			canvas.width = this.width;
			canvas.height = this.height;

			this.context = canvas.getContext("2d");
		},

		// called once before every frame where the icon will be used
		render() {
			const duration = 5000;
			const t = (performance.now() % duration) / duration;

			const radius = (size / 2) * 0.3;
			const outerRadius = (size / 2) * 0.7 * t + radius;
			const center = size / 2;
			const ctx = this.context;
			const tipSize = size / 10;
			if (!ctx) return false;

			ctx.clearRect(0, 0, this.width, this.height);
			// draw tip
			ctx.beginPath();
			ctx.fillStyle = highlight ? "#ff6464" : "#646464";
			ctx.moveTo(center, size / 4);
			ctx.lineTo(center - tipSize, center - tipSize);
			ctx.lineTo(center + tipSize, center - tipSize);
			ctx.fill();

			// draw outer circle
			if (highlight) {
				ctx.beginPath();
				ctx.arc(this.width / 2, this.height / 2, outerRadius, 0, Math.PI * 2);
				ctx.fillStyle = `rgba(255, 200, 200,${1 - t})`;
				ctx.fill();
			}
			// draw inner circle
			ctx.beginPath();
			ctx.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2);
			ctx.fillStyle = highlight ? "#ff6464" : "#646464";
			ctx.strokeStyle = "white";
			ctx.lineWidth = 2 + 4 * (highlight ? 1 - t : 1);
			ctx.fill();
			ctx.stroke();

			// update this image's data with data from the canvas
			this.data = ctx.getImageData(0, 0, this.width, this.height).data;

			// continuously repaint the map, resulting in the smooth animation of the dot
			if (highlight) map.triggerRepaint();

			// return `true` to let the map know that the image was updated
			return true;
		},
	};
	return symbol;
};
