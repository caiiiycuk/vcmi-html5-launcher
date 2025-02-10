import Keyboard from "simple-keyboard";

export function createKeyboard() {
    const isTouch = !!("ontouchstart" in window);
    const isPointer = window.PointerEvent ? true : false;

    new Keyboard({
        layout,
        onKeyPress: (button: string) => {
            if (button === "{enter}") {
                window.dispatchEvent(new KeyboardEvent("keydown", {
                    key: "Enter",
                    code: "Enter",
                    keyCode: 13,
                    which: 13,
                }));
                setTimeout(() => {
                    window.dispatchEvent(new KeyboardEvent("keyup", {
                        key: "Enter",
                        code: "Enter",
                        keyCode: 13,
                        which: 13,
                    }));
                }, 32);
                toggleKeyboard();
            } else if (button === "{bksp}") {
                window.dispatchEvent(new KeyboardEvent("keydown", {
                    key: "Backspace",
                    code: "Backspace",
                    keyCode: 8,
                    which: 8,
                }));
                setTimeout(() => {
                    window.dispatchEvent(new KeyboardEvent("keyup", {
                        key: "Backspace",
                        code: "Backspace",
                        keyCode: 8,
                        which: 8,
                    }));
                }, 32);
            } else {
                window.dispatchEvent(new KeyboardEvent("keypress", {
                    key: button,
                    charCode: button.charCodeAt(0),
                    keyCode: button.charCodeAt(0),
                    which: button.charCodeAt(0),
                }));
            }
        },
        preventMouseDownDefault: true,
        preventMouseUpDefault: true,
        stopMouseDownPropagation: true,
        stopMouseUpPropagation: true,
        autoUseTouchEvents: true,
        useMouseEvents: true,
    });

    const keyboardDiv = document.getElementById("keyboard") as HTMLDivElement;
    const keyboardContainer = document.getElementById("keyboard-container") as HTMLDivElement;

    keyboardDiv.style.visibility = "visible";

    if (isPointer) {
        keyboardDiv.addEventListener("pointerdown", toggleKeyboard);
    } else if (isTouch) {
        keyboardDiv.addEventListener("touchstart", toggleKeyboard);
    } else {
        keyboardDiv.addEventListener("mousedown", toggleKeyboard);
    }

    function toggleKeyboard(e?: Event) {
        if (keyboardContainer.style.display !== "block") {
            keyboardContainer.style.display = "block";
        } else {
            keyboardContainer.style.display = "none";
        }

        e?.stopPropagation();
        e?.preventDefault();
    };
}

const layout = {
    default: [
        "1 2 3 4 5 6 7 8 9 0 {bksp}",
        "q w e r t y u i o p",
        "a s d f g h j k l",
        "z x c v b n m {enter}",
    ],
};
