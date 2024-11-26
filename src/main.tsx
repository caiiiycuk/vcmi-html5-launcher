import { render } from "preact";
import "./index.css";


import { Provider, useDispatch, useSelector } from "react-redux";
import { State, store, uiSlice, VCMI_MODULE } from "./util/store";
import { Loader } from "./ui/resource-loader";
import { VCMIWindow } from "./ui/vcmi-window";

function App() {
    const state = useSelector((state: State) => state.ui.step);
    const dataUrl = useSelector((state: State) => state.ui.dataUrl);
    const wasmUrl = useSelector((state: State) => state.ui.wasmUrl);

    const dispatch = useDispatch();
    switch (state) {
        case "HAVE_URLS": {
            return <div>
                <button class="btn btn-xl" onClick={() => {
                    dispatch(uiSlice.actions.step("LOADING_DATA"));
                }}>Press to start</button>
            </div>;
        };
        case "LOADING_DATA": {
            return <Loader url={dataUrl} resourceType="datafile" />;
        };
        case "LOADING_WASM": 
            return <Loader url={wasmUrl} resourceType="wasm" />;
        case "READY_TO_RUN": 
            return <div>
                <button class="btn btn-xl" onClick={() => {
                    dispatch(uiSlice.actions.step("STARTED"));
                }}>Press to run</button>
            </div>;
        case "STARTED": {
            return <VCMIWindow />;
        }
    }

    return null;
}

(function() {
    render(
        <Provider store={store}>
            {<App /> as any}
        </Provider>,
        document.getElementById("app")!,
    );
})();
