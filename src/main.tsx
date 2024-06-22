import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "@mantine/core/styles.css";
import { MantineColorsTuple, MantineProvider, createTheme } from "@mantine/core";

const tecRed: MantineColorsTuple = [
	"#ffe9e9",
	"#ffd2d5",
	"#f7a5a8",
	"#f07479",
	"#ea4a51",
	"#e73037",
	"#e62129",
	"#cc131d",
	"#b80918",
	"#a10012",
];

const theme = createTheme({
	primaryColor: "tecRed",
	colors: {
		tecRed,
		tecYellow: [
			"#fffbe1",
			"#fff6cc",
			"#ffeb9b",
			"#ffe064",
			"#ffd738",
			"#ffd11c",
			"#ffce09",
			"#e3b600",
			"#c9a100",
			"#ae8b00",
		],
	},
});
// biome-ignore lint/style/noNonNullAssertion: Root should be defined
ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<MantineProvider theme={theme}>
			<App />
		</MantineProvider>
	</React.StrictMode>,
);
