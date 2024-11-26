export async function loadResource(
    url: string,
    responseType: "text" | "arraybuffer" | "response",
    progress: (progress: number) => void = () => { },
    resourceSize?: number,
): Promise<string | ArrayBuffer | Response> {
    const response = await fetch(url, {
        mode: "cors",
        credentials: "same-origin",
        redirect: "follow",
        cache: "default",
    });

    if (!response.ok || response.body == null) {
        throw new Error("Invalid fetch response. Code: " + response.status +
            "status: " + response.statusText + " url: " + url);
    }

    const totalBytes = resourceSize || parseInt(response.headers.get("Content-Length") || "0", 10) || 0;
    const progressiveResponse = getProgressiveResponse(response, totalBytes, progress);

    switch (responseType) {
        case "text":
            return progressiveResponse.text();
        case "arraybuffer":
            return progressiveResponse.arrayBuffer();
        default:
            return progressiveResponse;
    }
}

function getProgressiveResponse(response: Response, totalBytes: number, progress: (progress: number) => void) {
    if (totalBytes === 0) {
        progress(100);
        return response;
    }
    const progressiveResponse = new Response(new ReadableStream({
        start: async (readableStreamController: any) => {
            const reader = response.body!.getReader();
            let receivedBytes = 0;
            while (true) {
                const data = await reader.read();
                if (data.done) {
                    progress(100);
                    break;
                }

                receivedBytes += data.value.byteLength;
                progress(Math.min(100, Math.round(receivedBytes * 100 / totalBytes)));
                readableStreamController.enqueue(data.value);
            }
            readableStreamController.close();
        },
    }));

    for (const [header, value] of (response.headers as any).entries()) {
        progressiveResponse.headers.set(header, value);
    }
    return progressiveResponse;
}
