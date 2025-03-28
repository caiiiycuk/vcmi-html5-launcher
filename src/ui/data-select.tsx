import { useDispatch, useSelector } from "react-redux";
import { getClient, State, uiSlice, VCMI_GAME_FILES } from "../util/store";
import { useT } from "../i18n";
import { useEffect, useState } from "preact/hooks";
import { getGameDB } from "../util/db";
import { ClientSelect } from "./reusable";
import { GameFiles } from "./game-files";

export function DataSelect() {
    const t = useT();
    const dispatch = useDispatch();
    const [dbReady, setDBReady] = useState<boolean>(false);
    const [shortLegal, setShortLegal] = useState<boolean>(true);
    const gameFilesReady = useSelector((state: State) => state.ui.vcmiGameFilesReady);
    const noData = getClient(useSelector((state: State) => state.ui.client)).noData === true;

    useEffect(() => {
        if (noData) {
            setDBReady(true);
            dispatch(uiSlice.actions.step("LOADING_DATA"));
            return;
        }

        (async () => {
            try {
                const db = await getGameDB();
                await db.forEach((key, value) => {
                    key = key.substring(key.lastIndexOf("/") + 1).toLocaleLowerCase();
                    if (key in VCMI_GAME_FILES) {
                        VCMI_GAME_FILES[key].contents = value;
                    }
                });
            } catch (e) {
                console.error(e);
            } finally {
                setDBReady(true);
                dispatch(uiSlice.actions.checkVcmiGameFilesReady());
            }
        })().catch((e) => {
            console.error(e);
        });
    }, []);

    return <div class="flex flex-col">
        <article class="py-0" role="tabpanel">
            {!shortLegal &&
                <>
                    <h3 class="my-4">{t("about")}</h3>
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
            {shortLegal &&
                <>
                    <p>
                        {t("legal_text_short")}
                    </p>
                    <a href="#" class="absolute px-1 -bottom-2 right-4 bg-white" onClick={(e) => {
                        e.preventDefault();
                        setShortLegal(false);
                    }}>
                        {t("more")}
                    </a>
                </>
            }
        </article>
        <ClientSelect />
        {dbReady && <GameFiles />}
        {dbReady &&
            <div class="flex flex-row gap-1">
                <button class="min-w-4" onClick={() => window.open("https://t.me/dzhomm3", "_blank")}>
                    <p class="tg-link size-5 p-0 m-0"></p>
                </button>
                <button class="min-w-4" onClick={() => window.open("https://discord.gg/ZNj97WtjEq", "_blank")}>
                    <p class="discord-link size-5 p-0 m-0"></p>
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
                        dispatch(uiSlice.actions.step("LOADING_DATA"));
                    }}
                    disabled={!gameFilesReady}
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
