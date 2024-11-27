import { useEffect, useState } from "preact/hooks";
import { loadResource } from "../util/resource";
import { uiSlice, VCMI_MODULE } from "../util/store";
import { useDispatch } from "react-redux";
import { wasmInstantiate } from "../util/wasm";
import { useT } from "../i18n";

export function Loader(props: {
    url: string,
    resourceType: "datafile" | "wasm",
}) {
    const [progress, setProgress] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const dispatch = useDispatch();
    const t = useT();
    useEffect(() => {
        setError(null);
        (async () => {
            if (props.resourceType === "datafile") {
                const jsPromise = loadResource(props.url, "text", () => { });
                const dataPromise = loadResource(props.url.substring(0, props.url.length - 3), "arraybuffer", setProgress);
                const [js, data] = await Promise.all([jsPromise, dataPromise]);

                const Module = VCMI_MODULE;
                Module.getPreloadedPackage = (name: any, size: any) => data;
                eval(js as string);

                dispatch(uiSlice.actions.step("LOADING_WASM"));
            } else if (props.resourceType === "wasm") {
                const script = document.createElement("script");
                script.src = props.url;
                script.onload = () => {
                    const Module = VCMI_MODULE;

                    Module.instantiateWasm = async (
                        info: Record<string, Record<string, WebAssembly.ImportValue>>,
                        receiveInstance: (i: WebAssembly.Instance, m: WebAssembly.Module) => Promise<any>,
                    ) => {
                        const wasm: Response = await loadResource(props.url.substring(0, props.url.length - 3) + ".wasm", "response", setProgress) as Response;
                        const instance = await wasmInstantiate(wasm, info);
                        return receiveInstance(instance.instance, instance.wasmModule);
                    };

                    (window as any).VCMI(Module)
                        .then(() => {
                            dispatch(uiSlice.actions.step("READY_TO_RUN"));
                        })
                        .catch((e: any) => {
                            console.error(e);
                            setError(e.message ?? "wasm instantiation error");
                        });
                };
                script.onerror = (e) => {
                    console.error(e);
                    setError(e + "");
                };
                document.head.appendChild(script);
                // const wasmJs = await loadResource(props.url, "text") as string;
                // eval(wasmJs);
                // const fn = new (Function as any)(["Module"], wasmJs);
                // fn(Module);
            }
        })().catch((e) => {
            setError(e.message ?? "unknown error");
            console.error(e);
        });
    }, [props.url, props.resourceType]);

    return <div class="flex flex-col">
        <article class="pt-0" role="tabpanel">
            <h4 class="my-4">{t("loading_data_title")}</h4>
            <div class="flex flex-row">
                <progress class="w-full mr-2" max="100" value={progress}></progress>
                <span>{progress}%</span>
            </div>
        </article>
        {error &&
            <div class="mx-2 font-mono">
                <p class="my-0 text-xl">{t("error")}</p >
                <p class="text-red-500 font-bold">{error}</p>
                <p class="text-gray-600">{t("open_browser_logs")}</p>
                <button onClick={() => {
                    dispatch(uiSlice.actions.step("DATA_SELECT"))
                }}>{t("back")}</button>
            </div>
        }
    </div>;
}