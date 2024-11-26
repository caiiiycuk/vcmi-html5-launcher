export interface InstaniatedModule {
    wasmModule: WebAssembly.Module;
    instance: WebAssembly.Instance;
}

export async function wasmInstantiate(
    source: Response | ArrayBuffer,
    info: Record<string, Record<string, WebAssembly.ImportValue>>,
): Promise<InstaniatedModule> {
    if (source instanceof Response) {
        try {
            const module = await wasmInstantiateFromResponse(source, info);
            return module;
        } catch (error: any) {
            const instantiateStreamError = wasmInstantiateStreamError(source, error);
            try {
                console.error("ERR! Can't instantiate WASM from stream:\n" +
                    instantiateStreamError.message + "\n" + instantiateStreamError.stack);
                const module = await wasmInstantiateFromArray(await source.arrayBuffer(), info);
                return module;
            } catch (instantiateError: any) {
                console.error("ERR! Can't instantiate WASM:\n" + instantiateError);
                throw wasmInstantiateError(instantiateError, instantiateStreamError);
            }
        }
    } else {
        try {
            const module = await wasmInstantiateFromArray(source as ArrayBuffer, info);
            return module;
        } catch (instantiateError: any) {
            console.error("Can't instantiate WASM:\n" + instantiateError.name);
            throw wasmInstantiateError(instantiateError);
        }
    }
}

function wasmInstantiateFromArray(
    wasmData: ArrayBuffer,
    info: Record<string, Record<string, WebAssembly.ImportValue>>,
): Promise<InstaniatedModule> {
    const compileStartedAt = Date.now();
    return WebAssembly.compile(wasmData)
        .then((wasmModule) => {
            const compileTime = Date.now() - compileStartedAt;
            const instantiateStartedAt = Date.now();
            return WebAssembly.instantiate(wasmModule, info)
                .then((instance) => {
                    return {
                        wasmModule,
                        instance,
                        compileTime,
                        instantiateTime: Date.now() - instantiateStartedAt,
                        instantiateType: "array",
                    };
                });
        });
}

async function wasmInstantiateFromResponse(
    wasmResponse: Response,
    info: Record<string, Record<string, WebAssembly.ImportValue>>,
): Promise<InstaniatedModule> {
    return WebAssembly.instantiateStreaming(wasmResponse, info)
        .then((source) => {
            return {
                wasmModule: source.module,
                instance: source.instance,
            };
        });
}

function wasmInstantiateStreamError(response: Response, error: Error) {
    const headers: any = {};
    response.headers?.forEach((value, key) => {
        headers[key] = value;
    });

    const details = {
        sourceType: typeof response,
        instanceOfResponse: response instanceof Response,
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        type: response.type,
        headers: headers,
    };
    return {
        name: "wasm_instantiate_stream_failed: " + error.name,
        message: error.message,
        stack: "Details: " + JSON.stringify(details, null, 4) +"\nStack:\n" + error.stack,
    };
}

function wasmInstantiateError(instantiateError: Error, instantiateStreamError?: Error) {
    const streamingErrorMessage = instantiateStreamError !== undefined ?
        "\tStreamingError:\t" + instantiateStreamError.message :
        "";
    return {
        name: "wasm_instantiate_failed: " + instantiateError.name,
        message: instantiateError.message + streamingErrorMessage,
        stack: instantiateError.stack,
    };
}
