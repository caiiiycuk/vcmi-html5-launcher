import { useDispatch } from "react-redux";
import { uiSlice, version } from "../util/store";
import { useT } from "../i18n";

export function About() {
    const dispatch = useDispatch();
    const t = useT();

    return (
        <div class="flex flex-col">
            <article class="pt-0" role="tabpanel">
                <h3 class="my-4">{t("about")}</h3>
                <div>
                    <p>VCMI: {version}</p>
                    <p>{t("about_text")}</p>
                    <p class="font-bold">{t("authors")}</p>
                    <div class="flex flex-col gap-1">
                        <div class="flex flex-row items-center gap-4">
                            <a class="font-bold w-28" href="https://github.com/caiiiycuk"
                                target="_blank" rel="noopener noreferrer">@caiiiycuk</a> - Developer
                        </div>
                        <div class="flex flex-row items-center gap-4">
                            <a class="font-bold w-28" href="https://t.me/gamebase54"
                                target="_blank" rel="noopener noreferrer">@NicCarter54</a> - Idea, Philosophy, Testing
                        </div>
                        <div class="flex flex-row items-center gap-4">
                            <a class="font-bold w-28" href="https://github.com/AlexSnowLeo"
                                target="_blank" rel="noopener noreferrer">@AlexSnowLeo</a> - Testing
                        </div>
                        <div class="flex flex-row items-center gap-4">
                            <a class="font-bold w-28" href="https://vcmi.eu/"
                                target="_blank" rel="noopener noreferrer">VCMI Community</a> - Help
                        </div>
                    </div>
                    <p class="font-bold">{t("links")}</p>
                    <div class="flex flex-col gap-1">
                        <div class="flex flex-row items-center gap-4">
                            <a class="font-bold w-28" href="https://dos.zone/support"
                                target="_blank" rel="noopener noreferrer">{t("support")}</a>
                        </div>
                        <div class="flex flex-row items-center gap-4">
                            <a class="font-bold w-28" href="https://github.com/caiiiycuk/vcmi-wasm"
                                target="_blank" rel="noopener noreferrer">[1] {t("source_code")}</a>
                        </div>
                    </div>
                </div>
            </article>

            <div class="flex flex-row justify-between">
                <button onClick={() => dispatch(uiSlice.actions.step("DATA_SELECT"))}>
                    {t("back")}
                </button>
            </div>
        </div>
    );
}
