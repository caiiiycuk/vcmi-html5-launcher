import { useT } from "../i18n";
import { useDispatch, useSelector } from "react-redux";
import { getInitLang, State, uiSlice, VCMI_GAME_FILES } from "../util/store";
import { getGameDB } from "../util/db";
import { useRef, useState } from "preact/hooks";
import { Entry, Uint8ArrayWriter } from "@zip.js/zip.js";
import { BlobReader, ZipReader } from "@zip.js/zip.js";

export function GameFiles() {
    const dispatch = useDispatch();
    const t = useT();
    const filesReady = useSelector((state: State) => state.ui.vcmiGameFilesReady);
    const gameFileRef = useRef<HTMLInputElement>(null);
    const gameDirRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [file, setFile] = useState("");
    const [error, setError] = useState("");
    const notLoadedFiles = Object.keys(VCMI_GAME_FILES).filter((key) => {
        return VCMI_GAME_FILES[key].contents === null;
    });
    const inputOptions = { webkitdirectory: true, directory: true };

    async function doLoadFiles(e: Event) {
        setLoading(true);
        try {
            if (e.currentTarget !== null) {
                function getKey(filename: string) {
                    return filename.substring(filename.lastIndexOf("/") + 1).toLowerCase();
                }
                const files = (e.currentTarget as any).files;
                if (files !== null && files.length > 0) {
                    const db = await getGameDB();
                    if (files.length === 1 && files[0].name.toLowerCase().endsWith(".zip")) {
                        const variantZip = files[0];
                        setFile(t("scanning") + " " + variantZip.name);
                        const reader = new ZipReader(new BlobReader(variantZip));
                        const entries: Entry[] = [];
                        try {
                            for await (const next of reader.getEntriesGenerator()) {
                                const key = getKey(next.filename);
                                if (!next.directory && key in VCMI_GAME_FILES &&
                                    VCMI_GAME_FILES[key].contents === null &&
                                    !next.filename.startsWith("__MACOSX")) {
                                    entries.push(next);
                                }
                            }
                        } catch (e) {
                            throw new Error(t("not_an_archive"));
                        }
                        entries.sort((a, b) => b.uncompressedSize - a.uncompressedSize);
                        for (const next of entries) {
                            if (!next.directory && next.getData) {
                                setFile(t("unpacking") + " " + next.filename);
                                setProgress(0);
                                const data = await next.getData(new Uint8ArrayWriter(), {
                                    onprogress: (progress, total) => {
                                        setProgress(Math.round(progress / total * 100));
                                        return undefined;
                                    },
                                });
                                const key = getKey(next.filename);
                                VCMI_GAME_FILES[key].contents = data;
                                await db.put(key, data);
                            }
                        }
                    } else {
                        for (const file of files) {
                            setFile(file.name);
                            setProgress(0);
                            const key = getKey(file.name);
                            if (key in VCMI_GAME_FILES && VCMI_GAME_FILES[key].contents === null) {
                                const fileData = new Uint8Array(await file.arrayBuffer());
                                VCMI_GAME_FILES[key].contents = fileData;
                                setProgress(50);
                                await db.put(key, fileData);
                                setProgress(100);
                            }
                        }
                    }
                }
            }
        } catch (e: any) {
            setError(e.message ?? "unknown error");
            console.error(e);
        } finally {
            setLoading(false);
            dispatch(uiSlice.actions.checkVcmiGameFilesReady());
        }
    }

    return <div>
        <fieldset>
            <legend>{t("data_source")}</legend>
            {filesReady && !loading && !error && <div>
                {t("all_files_found")}&nbsp;
                <span class="link text-blue-500 underline cursor-pointer" onClick={() => {
                    (async function() {
                        try {
                            setLoading(true);
                            setFile(t("clearing_files"));
                            setProgress(0);
                            const db = await getGameDB();
                            await db.clear();
                            setProgress(50);
                            Object.keys(VCMI_GAME_FILES).forEach((key) => {
                                VCMI_GAME_FILES[key].contents = null;
                            });
                            dispatch(uiSlice.actions.checkVcmiGameFilesReady());
                        } catch (e: any) {
                            setError(e.message ?? "unknown error");
                            console.error(e);
                        } finally {
                            setLoading(false);
                        }
                    })().catch(console.error);
                }}>({t("clear")})</span>
            </div>}
            {!filesReady && !loading && !error && <div class="flex flex-row gap-2 items-center">
                <div class="">
                    {t("not_all_files_found")}
                    <ul>
                        {notLoadedFiles.map((file) => {
                            return <li>{VCMI_GAME_FILES[file].name}</li>;
                        })}
                    </ul>
                    {t("upload_missing_files")}
                    <input ref={gameFileRef} class="hidden" type="file"
                        name="game-file" multiple={true} onChange={doLoadFiles} />
                    <input ref={gameDirRef} class="hidden" type="file"
                        name="dir-file" {...inputOptions} onChange={doLoadFiles} />
                    <div class="flex mt-2 gap-2">
                        <button class="button-icon text-yellow-600" title={t("source_files_zip_hint")} onClick={() => {
                            gameFileRef.current?.click();
                        }}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                stroke-width="1.5" stroke="currentColor" class="size-6">
                                <path stroke-linecap="round" stroke-linejoin="round"
                                    d="M19.5 14.25v-2.625a3.375 3.375 0 0
                                0-3.375-3.375h-1.5A1.125
                                1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75
                                9v6m3-3H9m1.5-12H5.625c-.621
                                0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621
                                0 1.125-.504
                                1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                            </svg>
                        </button>
                        <button class="button-icon text-yellow-600" title={t("source_files_dir_hint")} onClick={() => {
                            gameDirRef.current?.click();
                        }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                                fill="currentColor" class="size-6">
                                <path d="M19.906 9c.382 0 .749.057 1.094.162V9a3 3 0 0 0-3-3h-3.879a.75.75 0 0
                                1-.53-.22L11.47 3.66A2.25 2.25 0 0 0 9.879 3H6a3 3 0 0 0-3 3v3.162A3.756 3.756 0 0 1
                                4.094 9h15.812ZM4.094 10.5a2.25 2.25 0 0 0-2.227 2.568l.857 6A2.25 2.25 0 0 0 4.951
                                21H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-2.227-2.568H4.094Z" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="m-auto border-solid border-0 border-l pl-4 ">
                    <button class="button-demo size-12 text-yellow-600" title={t("demo_hint")} onClick={() => {
                        window.open(location.pathname + "?demo=1&title=DEMO&lang=" + getInitLang(), "_self");
                    }}>
                        <img src="demo.jpg" alt="demo" class="size-full" />
                    </button>
                </div>
            </div>}
            {loading && !error && <article class="pt-0" role="tabpanel">
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
                    </div>
                </div>
            }
        </fieldset>
    </div>;
}
