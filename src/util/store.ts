import { configureStore, createSlice } from "@reduxjs/toolkit";
import { resetModule } from "./module";
import { getFilesDB } from "./db";


const initialUiState: {
    lang: "ru" | "en",
    homm3DataUrl: string,
    vcmiDataUrl: string,
    wasmUrl: string,
    step: "DATA_SELECT" | "LOADING_DATA" | "LOADING_WASM" | "READY_TO_RUN" | "STARTED",
    config: string,
} = {
    lang: navigator.language.startsWith("ru") ? "ru" : "en",
    homm3DataUrl: localStorage.getItem("vcmi.dataUrl") ?? "vcmi/",
    vcmiDataUrl: "vcmi/vcmi.data.js",
    wasmUrl: "vcmi/vcmiclient.js",
    step: "DATA_SELECT",
    config: localStorage.getItem("vcmi.config") ??
        `{
    "general" : {
        "language" : "${navigator.language.startsWith("ru") ? "russian" : "english"}",
    },
    "video" : {
        "resolution" : {
            "width": ${innerWidth}
            "height": ${innerHeight},
            "scaling": 100,
        }
    }
}`,
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
