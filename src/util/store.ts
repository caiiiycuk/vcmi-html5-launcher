import { configureStore, createSlice } from "@reduxjs/toolkit";
import { resetModule } from "./module";
import { getFilesDB } from "./db";

export const dataVersion = "1.5.7-wasm";
export const version = "1.5.7-wasm-4";
export const wasmUrl = "https://caiiiycuk.github.io/vcmi-wasm/vcmi/vcmiclient.js";
export const dataUrl = "https://caiiiycuk.github.io/vcmi-wasm/vcmi/vcmi.data.js";
export const localizedDataUrl = {
    "en": "https://caiiiycuk.github.io/vcmi-wasm/vcmi/en.data.js",
    "ru": "https://caiiiycuk.github.io/vcmi-wasm/vcmi/ru.data.js",
};

const maxSize = 1440;
const minSize = 600;
const params = new URLSearchParams(location.search);

const initialUiState: {
    lang: "ru" | "en",
    homm3DataUrl: string,
    step: "DATA_SELECT" | "LOADING_DATA" | "LOADING_WASM" | "READY_TO_RUN" | "STARTED" | "ABOUT",
    config: string,
    version: string,
} = {
    lang: (params.get("lang") ?? navigator.language).startsWith("ru") ? "ru" : "en",
    homm3DataUrl: params.get("url") ?? localStorage.getItem("vcmi.dataUrl") ?? "",
    step: "DATA_SELECT",
    config: localStorage.getItem("vcmi.config") ?? defaultConfig(),
    version,
};

export const uiSlice = createSlice({
    name: "ui",
    initialState: initialUiState,
    reducers: {
        step: (state, a: { payload: typeof initialUiState.step }) => {
            state.step = a.payload;

            if (state.step === "DATA_SELECT") {
                resetModule();
            }
        },
        setDataUrl: (state, a: { payload: string }) => {
            state.homm3DataUrl = a.payload;
            localStorage.setItem("vcmi.dataUrl", a.payload);
        },
        setConfig: (state, a: { payload: string }) => {
            state.config = a.payload;
            localStorage.setItem("vcmi.config", a.payload);
        },
    },
});

export const store = (() => {
    const store = configureStore({
        reducer: {
            ui: uiSlice.reducer,
        },
    });

    (async () => {
        const db = await getFilesDB();
        const config = await db.get("/home/web_user/.config/vcmi/settings.json");
        if (config && config.length > 0) {
            store.dispatch(uiSlice.actions.setConfig(new TextDecoder().decode(config)));
        }
    })().catch(console.error);

    return store;
})();

export interface State {
    ui: typeof initialUiState,
}

export function defaultConfig() {
    const [widht, height] = getScreenResolution();
    return `{
    "general" : {
        "language" : "${navigator.language.startsWith("ru") ? "russian" : "english"}",
        "autosaveCountLimit" : 1
    },
    "video" : {
        "resolution" : {
            "width" : ${widht},
            "height" : ${height},
            "scaling" : 100
        }
    },
    "server" : {
        "remoteHostname" : "netherlands.dos.zone"
    },
    "lobby" :  {
        "hostname" : "netherlands.dos.zone"
    }
}`;
}

export function getScreenResolution() {
    const dpi = Math.max(1, Math.min(devicePixelRatio, 2));
    let width = Math.round(innerWidth * dpi);
    let height = Math.round(innerHeight * dpi);
    if (width > maxSize) {
        height = Math.round(height * maxSize / width);
        width = maxSize;
    }
    if (height > maxSize) {
        width = Math.round(width * maxSize / height);
        height = maxSize;
    }
    if (width < minSize) {
        height = Math.round(height * minSize / width);
        width = minSize;
    }
    if (height < minSize) {
        width = Math.round(width * height / minSize);
        height = minSize;
    }

    return [width, height];
}
