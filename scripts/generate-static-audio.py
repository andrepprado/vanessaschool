import asyncio
import hashlib
import json
import os
import sys
import edge_tts

ROOT = os.getcwd()

PHRASES_FILE = os.path.join(
    ROOT,
    "audio",
    "static",
    "phrases.json"
)

OUTPUT_DIR = os.path.join(
    ROOT,
    "audio",
    "static",
    "files"
)

MANIFEST_FILE = os.path.join(
    ROOT,
    "audio",
    "static",
    "manifest.json"
)

VOICE = "en-US-AriaNeural"
RATE = "-2%"
VOLUME = "+0%"

CONCURRENCY = 6
RETRIES = 4

os.makedirs(
    OUTPUT_DIR,
    exist_ok=True
)

with open(
    PHRASES_FILE,
    "r",
    encoding="utf-8"
) as file:
    phrases = json.load(file)

def normalize(text):
    return " ".join(
        str(text).replace(
            "\u00a0",
            " "
        ).split()
    ).strip()

def audio_id(text):
    return hashlib.sha256(
        normalize(text).encode(
            "utf-8"
        )
    ).hexdigest()[:24]

manifest = {}

semaphore = asyncio.Semaphore(
    CONCURRENCY
)

async def generate_one(
    index,
    total,
    text
):
    normalized = normalize(text)

    key = normalized

    filename = (
        audio_id(normalized) +
        ".mp3"
    )

    filepath = os.path.join(
        OUTPUT_DIR,
        filename
    )

    public_path = (
        "/audio/static/files/" +
        filename
    )

    manifest[key] = public_path

    if (
        os.path.exists(filepath) and
        os.path.getsize(filepath) > 1000
    ):
        print(
            f"[{index}/{total}] CACHE {normalized[:70]}"
        )
        return

    async with semaphore:
        for attempt in range(
            1,
            RETRIES + 1
        ):
            try:
                print(
                    f"[{index}/{total}] GENERATE {normalized[:70]}"
                )

                communicate = (
                    edge_tts.Communicate(
                        normalized,
                        VOICE,
                        rate=RATE,
                        volume=VOLUME
                    )
                )

                await communicate.save(
                    filepath
                )

                if (
                    not os.path.exists(filepath) or
                    os.path.getsize(filepath) <= 1000
                ):
                    raise RuntimeError(
                        "Generated audio file is empty."
                    )

                return

            except Exception as error:
                print(
                    f"  attempt {attempt}/{RETRIES} failed: {error}"
                )

                if attempt >= RETRIES:
                    raise

                await asyncio.sleep(
                    attempt * 2
                )

async def main():
    tasks = []

    total = len(phrases)

    for index, phrase in enumerate(
        phrases,
        start=1
    ):
        tasks.append(
            generate_one(
                index,
                total,
                phrase
            )
        )

    await asyncio.gather(
        *tasks
    )

    manifest_payload = {
        "version":
            1,

        "voice":
            VOICE,

        "count":
            len(manifest),

        "items":
            manifest
    }

    with open(
        MANIFEST_FILE,
        "w",
        encoding="utf-8"
    ) as file:
        json.dump(
            manifest_payload,
            file,
            ensure_ascii=False,
            indent=2
        )

    print("")
    print(
        f"Static audio library ready: {len(manifest)} files."
    )

asyncio.run(
    main()
)
