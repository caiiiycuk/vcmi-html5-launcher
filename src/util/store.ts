import { configureStore, createSlice } from "@reduxjs/toolkit";
import { loadResource } from "./resource";

export let VCMI_MODULE: any = {};

const initialUiState: {
    dataUrl: string,
    wasmUrl: string,
    step: "HAVE_URLS" | "LOADING_DATA" | "LOADING_WASM" | "READY_TO_RUN" | "STARTED",
} = {
    dataUrl: "vcmi/vcmi.data.js",
    wasmUrl: "vcmi/vcmiclient.js",
    step: "HAVE_URLS",
};

export const uiSlice = createSlice({
    name: "ui",
    initialState: initialUiState,
    reducers: {
        step: (state, a: { payload: typeof initialUiState.step }) => {
            state.step = a.payload;

            if (state.step === "HAVE_URLS") {
                VCMI_MODULE = {};
            }
        },
    }
});

export const store = configureStore({
    reducer: {
        ui: uiSlice.reducer,
    },
});

export interface State {
    ui: typeof initialUiState,
}

// for debug
(window as any).VCMI_MODULE = VCMI_MODULE;