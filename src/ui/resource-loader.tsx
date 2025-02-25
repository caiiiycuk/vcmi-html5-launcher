import { useEffect, useState } from "preact/hooks";
import { loadResource } from "../util/resource";
import { State, uiSlice, getClient, unprefixedDataUrlPrefix,
    unprefixedDataUrl, unprefixedLocalizedDataUrl } from "../util/store";
import { useDispatch, useSelector } from "react-redux";
import { wasmInstantiate } from "../util/wasm";
import { useT } from "../i18n";
import { getDataDB } from "../util/db";
import { VCMI_MODULE } from "../util/module";
import { ClientSelect } from "./reusable";

export function Loader(props: {
    resourceType: "datafile" | "wasm",
}) {
    const client = getClient(useSelector((state: State) => state.ui.client));
    const lang = useSelector((state: State) => state.ui.lang);
    const [file, setFile] = useState<string>("");
    const [progress, setProgress] = useState<number>(0);
    const [error, setError] = useState<string | null>(null);
    const wasmUrl = client.wasmUrl;
    const dataUrl = client.dataUrl;
    const localizedDataUrl = client.localizedDataUrl;
    const dispatch = useDispatch();
    const t = useT();
    useEffect(() => {
        setError(null);
        (async () => {
            if (props.resourceType === "datafile") {
                const db = await getDataDB();

                // load data
                const loadDataFile = async (dataUrl: string, dataKeyPrefix?: string) => {
                    const dataContentsUrl = dataUrl.substring(0, dataUrl.length - 3);
                    const dataKey = (dataKeyPrefix ? dataKeyPrefix + ".data.js" :
                        dataUrl.substring(dataUrl.lastIndexOf("/") + 1));
                    const dataContentsKey = (dataKeyPrefix ? dataKeyPrefix + ".data" :
                        dataContentsUrl.substring(dataContentsUrl.lastIndexOf("/") + 1));
                    let [data, dataContents] = await Promise.all([db.get(dataKey),
                        db.get(dataContentsKey)]);
                    let dataJs: string | null = null;
                    if (data !== null) {
                        dataJs = new TextDecoder().decode(data);
                    }
                    if (dataJs === null || dataContents === null) {
                        dataJs = await loadResource(dataUrl, "text", () => { }) as string;
                        dataContents = new Uint8Array(await loadResource(dataContentsUrl,
                            "arraybuffer", setProgress) as ArrayBuffer);
                        db.put(dataKey, new TextEncoder().encode(dataJs)).catch(console.error);
                        db.put(dataContentsKey, dataContents).catch(console.error);
                    }

                    return [dataJs, dataContents.buffer] as [string, ArrayBuffer];
                };

                // load vcmi data
                {
                    setFile("VCMI/Data");
                    VCMI_MODULE.data = await loadDataFile(dataUrl,
                        dataUrl === unprefixedDataUrl ? unprefixedDataUrlPrefix : undefined);
                }

                // load localized data
                if (localizedDataUrl) {
                    const key = lang === "ru" ? "ru" : "en";
                    setFile("VCMI/" + key + "-Data");
                    VCMI_MODULE.localizedData = await loadDataFile(localizedDataUrl[key],
                        localizedDataUrl[key] === unprefixedLocalizedDataUrl[key] ?
                            unprefixedDataUrlPrefix + "-" + key : undefined);
                }

                // load mods
                const modsUrl = new URLSearchParams(location.search).get("modsUrl") ?? client.mods;
                if (modsUrl) {
                    setFile("VCMI/Mods");
                    VCMI_MODULE.modsData = await loadDataFile(modsUrl);
                }

                VCMI_MODULE.getPreloadedPackage = (name: any, size: any) => {
                    let data;
                    if (name.startsWith("vcmi.data")) {
                        data = VCMI_MODULE.data![1];
                        delete VCMI_MODULE.data;
                    } else if (name.indexOf(".mods.") !== -1) {
                        data = VCMI_MODULE.modsData![1];
                        delete VCMI_MODULE.modsData;
                    } else {
                        data = VCMI_MODULE.localizedData![1];
                        delete VCMI_MODULE.localizedData;
                    }
                    return data;
                };

                const Module = VCMI_MODULE;
                eval(Module.data![0]);
                if (localizedDataUrl) {
                    eval(Module.localizedData![0]);
                }
                if (modsUrl) {
                    eval(Module.modsData![0]);
                }
                dispatch(uiSlice.actions.step("READY_TO_RUN"));
            } else if (props.resourceType === "wasm") {
                setFile("VCMI/WebAssembly");
                const wasmScript = await loadResource(wasmUrl, "text", setProgress) as string;
                const wasmScriptUrl = URL.createObjectURL(new Blob([wasmScript], { type: "text/javascript" }));
                const script = document.createElement("script");
                script.src = wasmScriptUrl;
                script.onload = () => {
                    const Module = VCMI_MODULE;

                    Module.instantiateWasm = async (
                        info: Record<string, Record<string, WebAssembly.ImportValue>>,
                        receiveInstance: (i: WebAssembly.Instance, m: WebAssembly.Module) => Promise<any>,
                    ) => {
                        const wasm: Response = await loadResource(wasmUrl.substring(0, wasmUrl.length - 3) + ".wasm",
                            "response", setProgress) as Response;
                        const instance = await wasmInstantiate(wasm, info);
                        return receiveInstance(instance.instance, instance.wasmModule);
                    };

                    try {
                        /* eslint-disable-next-line new-cap */
                        (window as any).VCMI(Module)
                            .then((_module: typeof VCMI_MODULE) => {
                                dispatch(uiSlice.actions.step("DATA_SELECT"));
                            })
                            .catch((e: any) => {
                                console.error(e);
                                setError(e.message ?? "wasm instantiation error");
                            });
                    } catch (e: any) {
                        console.error(e);
                        setError(e.message ?? "wasm instantiation error");
                    }
                };
                script.onerror = (e) => {
                    console.error(e);
                    setError(e + "");
                };
                document.head.appendChild(script);
            }
        })().catch((e) => {
            setError(e.message ?? "unknown error");
            console.error(e);
        });
    }, [props.resourceType, lang]);

    return <div class="flex flex-col">
        {!error && <article class="pt-0" role="tabpanel">
            <h4 class="my-4">{t("loading_data_title")}</h4>
            <div class="flex flex-row">
                <progress class="w-full mr-2" max="100" value={progress}></progress>
                <span>{progress}%</span>
            </div>
            <p class="text-gray-600">{file}</p>
        </article>}
        {error &&
            <div>
                <div class="mx-2 font-mono mb-4">
                    <p class="my-0 text-xl">{t("error")}</p >
                    {error.indexOf("SharedArrayBuffer") !== -1 &&
                        <p class="text-red-500 font-bold">{t("browser_is_not_supported")}</p>
                    }
                    <p class="text-red-500 font-bold">{error}</p>
                    <p class="text-gray-600">{t("open_browser_logs")}</p>
                    {props.resourceType !== "wasm" && <button onClick={() => {
                        dispatch(uiSlice.actions.step("DATA_SELECT"));
                    }}>{t("back")}</button>}
                </div>
                <ClientSelect />
            </div>
        }
    </div>;
}
