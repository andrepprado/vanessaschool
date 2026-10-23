import csv
import json
import re
import time
import urllib.robotparser
from collections import deque
from pathlib import Path
from urllib.parse import urljoin, urlparse, urldefrag

from scrapling.fetchers import Fetcher

BASE = "https://www.elllo.org/"
ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
DATA.mkdir(parents=True, exist_ok=True)

STATE = DATA / "estado.json"
CSV = DATA / "catalogo_elllo.csv"
JSON = DATA / "catalogo_elllo.json"

USER_AGENT = "VanessaSchoolCatalogBot/1.0"
DELAY = 2.0
MAX_PAGES = 10000

robots = urllib.robotparser.RobotFileParser()
robots.set_url(urljoin(BASE, "robots.txt"))

try:
    robots.read()
except Exception as exc:
    raise SystemExit(
        f"Nao foi possivel verificar robots.txt: {exc}"
    )

def normalize(url):
    url, _ = urldefrag(url)
    parsed = urlparse(url)

    if parsed.scheme not in ("http", "https"):
        return None

    if parsed.hostname not in ("elllo.org", "www.elllo.org"):
        return None

    if re.search(
        r"\.(mp3|mp4|wav|pdf|zip|jpg|jpeg|png|gif|webp|css|js)$",
        parsed.path,
        re.I,
    ):
        return None

    return parsed._replace(
        scheme="https",
        netloc="www.elllo.org",
        query="",
        fragment="",
    ).geturl()

def restore():
    if STATE.exists():
        data = json.loads(STATE.read_text(encoding="utf-8"))
        return (
            deque(data.get("pending", [])),
            set(data.get("visited", [])),
            data.get("records", []),
        )

    return deque([BASE]), set(), []

def save(pending, visited, records):
    data = {
        "pending": list(pending),
        "visited": sorted(visited),
        "records": records,
    }

    temp = STATE.with_suffix(".tmp")
    temp.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    temp.replace(STATE)

    JSON.write_text(
        json.dumps(records, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    with CSV.open("w", encoding="utf-8-sig", newline="") as file:
        fields = [
            "url",
            "titulo",
            "nivel",
            "audios",
            "videos",
            "pdfs",
            "quiz",
        ]

        writer = csv.DictWriter(
            file,
            fieldnames=fields,
            delimiter=";",
        )
        writer.writeheader()

        for record in records:
            row = dict(record)

            for key in ("audios", "videos", "pdfs"):
                row[key] = " | ".join(row[key])

            writer.writerow(row)

def extract(url, page):
    titles = page.css("title::text").getall()
    title = titles[0].strip() if titles else ""

    text = " ".join(page.css("body *::text").getall())
    text = re.sub(r"\s+", " ", text)

    levels = sorted(set(re.findall(
        r"\b(?:A1|A2|B1|B2|C1|C2)\b",
        text,
    )))

    assets = []

    for selector, attr in (
        ("a[href]", "href"),
        ("audio[src]", "src"),
        ("video[src]", "src"),
        ("source[src]", "src"),
    ):
        for element in page.css(selector):
            value = element.attrib.get(attr)

            if value:
                assets.append(urljoin(url, value))

    return {
        "url": url,
        "titulo": title,
        "nivel": ", ".join(levels),
        "audios": sorted(set(
            x for x in assets
            if urlparse(x).path.lower().endswith((".mp3", ".wav"))
        )),
        "videos": sorted(set(
            x for x in assets
            if urlparse(x).path.lower().endswith(".mp4")
        )),
        "pdfs": sorted(set(
            x for x in assets
            if urlparse(x).path.lower().endswith(".pdf")
        )),
        "quiz": bool(re.search(r"\bquiz\b", text, re.I)),
    }

def main():
    pending, visited, records = restore()
    queued = set(pending)

    print("=== ELLLO / SCRAPLING ===")
    print("Limite de paginas:", MAX_PAGES)
    print("Intervalo entre requisicoes:", DELAY, "segundos")
    print("Destino:", DATA)
    print()

    try:
        while pending and len(visited) < MAX_PAGES:
            url = pending.popleft()
            queued.discard(url)

            url = normalize(url)

            if not url or url in visited:
                continue

            if not robots.can_fetch(USER_AGENT, url):
                print("[ROBOTS] Ignorado:", url)
                visited.add(url)
                continue

            try:
                page = Fetcher.get(
                    url,
                    timeout=30,
                    stealthy_headers=False,
                )

                status = getattr(page, "status", None)

                if status in (403, 429):
                    print("[BLOQUEIO]", status, url)
                    pending.appendleft(url)
                    break

                if status != 200:
                    print("[HTTP]", status, url)
                    visited.add(url)
                    time.sleep(DELAY)
                    continue

                records.append(extract(url, page))
                visited.add(url)

                for element in page.css("a[href]"):
                    href = element.attrib.get("href")

                    if not href:
                        continue

                    target = normalize(urljoin(url, href))

                    if (
                        target
                        and target not in visited
                        and target not in queued
                    ):
                        pending.append(target)
                        queued.add(target)

                print(
                    f"[{len(visited)}] "
                    f"Pendentes={len(pending)} "
                    f"URL={url}"
                )

            except Exception as exc:
                print("[ERRO]", url, str(exc))
                visited.add(url)

            if len(visited) % 20 == 0:
                save(pending, visited, records)
                print("[SALVO] Registros:", len(records))

            time.sleep(DELAY)

    except KeyboardInterrupt:
        print("\n[INTERROMPIDO] Salvando progresso...")

    finally:
        save(pending, visited, records)

        print("\n=== RESULTADO ===")
        print("Paginas visitadas:", len(visited))
        print("Paginas catalogadas:", len(records))
        print("Pendentes:", len(pending))
        print("CSV:", CSV)
        print("JSON:", JSON)
        print("Estado:", STATE)

if __name__ == "__main__":
    main()