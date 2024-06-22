import parse from "csv-simple-parser";
import sanitize from "sanitize-filename";

const inFile = Bun.file(process.argv.slice(2)[0]);
const routeFolder = process.argv.slice(2)[2];

async function attemptRead(row: Rec) {
	const route_code_names: string[] = [];
	const names = [`${row.agency_id}_${row.route_id}_0`, `${row.agency_id}_${row.route_id}_1`];
	for (const name of names) {
		const routeFile = Bun.file(`${routeFolder}/${sanitize(name)}.geojson`);
		if (await routeFile.exists()) {
			try {
				const contents = await routeFile.json();
				if (contents.features[0].properties.route_id === row.route_id) {
					route_code_names.push(sanitize(name));
				}
			} catch (e) {
				console.log("e", e);
				console.log(`error reading ${routeFolder}/${sanitize(name)}.geojson`);
			}
		}
	}
	return route_code_names;
}

type Rec = {
	route_id: string;
	agency_id: string;
	route_short_name: string;
	route_long_name: string;
	route_desc: string;
	route_type: string;
	route_url: string;
	route_code_names: string[];
};

const csv = parse((await inFile.text()).trim(), { header: true, infer: true }) as Rec[];

for (const row of csv) {
	row.route_short_name = `${row.route_short_name}`; // ensure string (some are numbers)
	row.route_code_names = await attemptRead(row);
}
await Bun.write(process.argv.slice(2)[1], JSON.stringify(csv, null, 2));
console.log(`written to "${process.argv.slice(2)[1]}" ✨`);
