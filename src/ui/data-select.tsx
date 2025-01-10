import { useDispatch, useSelector } from "react-redux";
import { archiveOrgLinks, clients, State, uiSlice } from "../util/store";
import { useT } from "../i18n";
import { useEffect, useState } from "preact/hooks";
import { getDataDB } from "../util/db";
import { VCMI_DATA, VCMI_MODULE } from "../util/module";
import { ClientSelect, LanguageSelect } from "./reusable";

export function DataSelect() {
    const t = useT();
    const dispatch = useDispatch();
    const [dataType, setDataType] = useState<"file" | "db" | "none">("none");
    const [hoMM3InDB, setHoMM3InDB] = useState<boolean>(false);
    const [dbReady, setDBReady] = useState<boolean>(false);
    const [shortLegal, setShortLegal] = useState<boolean>(true);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const inputOptions = isMobile ?
        { multiple: true } :
        { webkitdirectory: true, directory: true };
    const [dataSelected, setDataSelected] = useState(false);
    const language = useSelector((state: State) => state.ui.lang);
    useEffect(() => {
        const onend = () => {
            setDBReady(true);
            let hoMM3InDB = true;
            for (const next of Object.keys(VCMI_DATA)) {
                if (VCMI_DATA[next] === null) {
                    hoMM3InDB = false;
                    break;
                }
            }

            if (hoMM3InDB) {
                setHoMM3InDB(hoMM3InDB);
                setDataType("db");
            } else {
                setDataType("file");
            }
        };

        (async () => {
            try {
                const db = await getDataDB();
                await db.forEach((key, value) => {
                    if (VCMI_DATA[key] !== undefined) {
                        VCMI_DATA[key] = value;
                    }
                });
            } catch (e) {
                console.error(e);
            } finally {
                onend();
            }
        })().catch((e) => {
            console.error(e);
            onend();
        });
    }, []);

    return <div class="flex flex-col">
        <article class="pt-0" role="tabpanel">
            {!shortLegal &&
                <>
                    <h3 class="my-4">{t("legal")}</h3>
                    <p>
                        {t("legal_text")}
                    </p>
                    <p class="mt-2">
                        [1] — <a href="https://github.com/vcmi/"
                            target="_blank">VCMI</a> ;
                        [2] — <a href="https://www.gog.com/en/game/heroes_of_might_and_magic_3_complete_edition"
                            target="_blank">HoMM3</a>
                    </p>
                </>
            }
            <div class="field-row mt-4">
                <input checked type="checkbox" disabled id="confirm_legal_copy" />
                <label class="font-bold" for="confirm_legal_copy">
                    {t("confirm_legal_copy")}
                </label>
            </div>
            {shortLegal &&
                <a href="#" class="absolute px-1 -bottom-1 right-4 bg-white" onClick={(e) => {
                    e.preventDefault();
                    setShortLegal(false);
                }}>
                    {t("more")}
                </a>
            }
        </article>
        {!dataSelected && <ClientSelect />}
        {!dataSelected && <fieldset>
            <legend>{t("data_source")}</legend>
            <div class="field-row mb-4">
                <input disabled={!hoMM3InDB} checked={dataType === "db"} onChange={() => setDataType("db")}
                    id="data-db" type="radio" name="data-source" />
                <label for="data-db">{t("data_db")}</label>
            </div>
            <div class="field-row">
                <input disabled={!dbReady} checked={dataType === "file"} onChange={() => setDataType("file")}
                    id="data-provider" type="radio" name="data-provider" />
                <label for="data-provider">{t("data_provider")}</label>
            </div>
            {dataType === "file" &&
                <div class="ml-6 mt-4 flex flex-row gap-2 flex-wrap">
                    <button class="archive-link" onClick={() => {
                        // window.open(archiveOrgLinks[language].complete, "_blank");
                        setDataSelected(true);
                    }}>
                        <div class="complete-edition-link"></div>
                    </button>
                    <button class="archive-link link-disabled" onClick={() => { }}>
                        <div class="hota-link"></div>
                    </button>
                    <button class="archive-link link-disabled" onClick={() => { }}>
                        <div class="wog-link"></div>
                    </button>
                    <button class="archive-link link-disabled" onClick={() => { }}>
                        <div class="chronicles-link"></div>
                    </button>
                </div>}
        </fieldset>}
        {dataSelected && <fieldset>
            <div class="field-row">
                <input disabled={!dbReady} checked={dataType === "file"}
                    onChange={() => setDataType("file")}
                    id="data-directory" type="radio" name="data-source" />
                <label for="data-directory">{t("data_archive")}</label>
            </div>
            <div class="field-row">
                <input class="ml-4" id="data-file" type="file" name="data-file"
                    {...inputOptions}
                    onChange={(e) => {
                        if (e.currentTarget.files !== null) {
                            setDataType("file");
                            VCMI_MODULE.homm3Files = e.currentTarget.files;
                        }
                    }} />
            </div>
            <div class="mt-4 ml-4 font-bold">{t("data_archive_text")}</div>
        </fieldset>}
        {dbReady &&
            <div class="flex flex-row gap-1">
                <button class="min-w-4" onClick={() => window.open("https://t.me/dzhomm3", "_blank")}>
                    <p class="tg-link size-5 p-0 m-0"></p>
                </button>
                <button class="min-w-4" onClick={() => dispatch(uiSlice.actions.step("ABOUT"))}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                        stroke-width="1.5" stroke="currentColor" class="size-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9.879 7.519c1.171-1.025
                            3.071-1.025 4.242 0 1.172 1.025 1.172 2.687
                            0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45
                            1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                    </svg>
                </button>
                <div class="flex-grow"></div>
                <button class="self-end"
                    onClick={() => {
                        if (dataType === "db") {
                            delete VCMI_MODULE.homm3Files;
                            dispatch(uiSlice.actions.step("READY_TO_RUN"));
                        } else {
                            for (const next of Object.keys(VCMI_DATA)) {
                                VCMI_DATA[next] = null;
                            }
                            dispatch(uiSlice.actions.step("LOADING_DATA"));
                        }
                    }}
                    disabled={!dataSelected && dataType !== "db"}
                >
                    {t("next")}
                </button>
            </div>
        }
        {
            !dbReady &&
            <p class="self-end font-bold my-1 text-gray-400">{t("loading_db")}</p>
        }
    </div >;
}
