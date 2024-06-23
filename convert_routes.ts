import parse from "csv-simple-parser";
import sanitize from "sanitize-filename";

const inFile = Bun.file(process.argv.slice(2)[0]);
const outSingleFile = Bun.file(process.argv.slice(2)[1]);

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
await Bun.write(outSingleFile, JSON.stringify(csv, null, 2));
console.log(`written to "${process.argv.slice(2)[1]}" ✨`);
