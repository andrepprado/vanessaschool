"""Coleta metadados publicos para pesquisa, sem replicar material protegido."""
import json
from pathlib import Path
from datetime import datetime, timezone
from urllib.parse import urlparse
from scrapling.fetchers import Fetcher

URL = 'https://www.ets.org/toefl/test-takers/ibt/prepare/sample-test-jan-2026-1.html'
response = Fetcher.get(URL)
if getattr(response, 'status', None) != 200:
    raise RuntimeError(f'ETS retornou HTTP {getattr(response, "status", "desconhecido")}')
record = {
    'source': URL,
    'host': urlparse(URL).hostname,
    'collected_at': datetime.now(timezone.utc).isoformat(),
    'title': [str(x).strip()[:250] for x in response.css('title::text').getall()[:1]],
    'headings': [str(x).strip()[:250] for x in response.css('h1::text, h2::text, h3::text').getall()[:30]],
    'note': 'Somente metadados de referencia. Nao reutilizar questoes e audios da ETS.'
}
out = Path(__file__).with_name('referencia-ets.json')
out.write_text(json.dumps(record, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'Metadados salvos em {out}')