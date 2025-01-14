import { useDispatch, useSelector } from "react-redux";
import { variantsUrls, State, uiSlice } from "../util/store";
import { useT } from "../i18n";
import { useEffect, useState } from "preact/hooks";
import { getVariantDB } from "../util/db";
import { isDataSet, VCMI_MODULE } from "../util/module";
import { ClientSelect } from "./reusable";

export function DataSelect() {
    const t = useT();
    const dispatch = useDispatch();
    const [dataType, setDataType] = useState<"file" | "db" | "none">("none");
    const [variantInDb, setVariantInDB] = useState<boolean>(false);
    const [dbReady, setDBReady] = useState<boolean>(false);
    const [shortLegal, setShortLegal] = useState<boolean>(true);
    const [dataSelected, setDataSelected] = useState(false);
    const lang = useSelector((state: State) => state.ui.lang);

    useEffect(() => {
        (async () => {
            try {
                const db = await getVariantDB();
                if (isDataSet(await db.keys())) {
                    setVariantInDB(true);
                    setDataType("db");
                } else {
                    setVariantInDB(false);
                    setDataType("file");
                }
            } catch (e) {
                console.error(e);
            } finally {
                setDBReady(true);
            }
        })().catch((e) => {
            console.error(e);
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
                <input disabled={!variantInDb} checked={dataType === "db"} onChange={() => setDataType("db")}
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
                        window.open(variantsUrls[lang].complete, "_blank");
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
                    <button class="archive-link text-yellow-600" onClick={() => setDataSelected(true)}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-12">
                            <path d="M19.906 9c.382 0 .749.057 1.094.162V9a3 3 0 0 0-3-3h-3.879a.75.75 0 0
                                1-.53-.22L11.47 3.66A2.25 2.25 0 0 0 9.879 3H6a3 3 0 0 0-3 3v3.162A3.756 3.756 0 0 1
                                4.094 9h15.812ZM4.094 10.5a2.25 2.25 0 0 0-2.227 2.568l.857 6A2.25 2.25 0 0 0 4.951
                                21H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-2.227-2.568H4.094Z" />
                        </svg>

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
                    onChange={(e) => {
                        if (e.currentTarget.files !== null && e.currentTarget.files.length > 0) {
                            setDataType("file");
                            VCMI_MODULE.variantZip = e.currentTarget.files[0];
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
                            delete VCMI_MODULE.variantZip;
                        }

                        dispatch(uiSlice.actions.step("LOADING_DATA"));
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
