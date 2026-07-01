"""
Tiny search proxy — runs on host, provides web search + fetch for worker pod.
Worker calls: http://host.docker.internal:9779/search?q=...
"""
import httpx, re, urllib.parse, asyncio
from fastapi import FastAPI, HTTPException, Query
import uvicorn

app = FastAPI(title="Search Proxy")

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"


async def _ddg_lite(query: str) -> list[dict]:
    """DuckDuckGo Lite search."""
    async with httpx.AsyncClient(timeout=15, follow_redirects=True) as c:
        r = await c.get("https://lite.duckduckgo.com/lite/",
            params={"q": query}, headers={"User-Agent": UA})
        if r.status_code != 200:
            return []
        html = r.text
        links = re.findall(r'<a[^>]*href="([^"]*)"[^>]*class="[^"]*result-link[^"]*"[^>]*>(.*?)</a>', html)
        snippets = re.findall(r'<span[^>]*class="[^"]*result-snippet[^"]*"[^>]*>(.*?)</span>', html)
        results = []
        for i, (url, title) in enumerate(links[:10]):
            snip = snippets[i] if i < len(snippets) else ""
            results.append({
                "title": re.sub(r'<[^>]+>', '', title).strip(),
                "url": url,
                "snippet": re.sub(r'<[^>]+>', '', snip).strip(),
            })
        return results


async def _bing_search(query: str) -> list[dict]:
    """Bing search fallback."""
    url = f"https://www.bing.com/search?q={urllib.parse.quote(query)}"
    async with httpx.AsyncClient(timeout=15, follow_redirects=True) as c:
        r = await c.get(url, headers={"User-Agent": UA})
        if r.status_code != 200:
            return []
        html = r.text
        blocks = re.findall(r'<li[^>]*class="[^"]*b_algo[^"]*"[^>]*>(.*?)</li>', html, re.DOTALL)
        results = []
        for block in blocks[:10]:
            link = re.search(r'<a[^>]*href="([^"]*)"[^>]*>(.*?)</a>', block)
            snippet = re.search(r'<p[^>]*>(.*?)</p>', block)
            if link:
                results.append({
                    "title": re.sub(r'<[^>]+>', '', link.group(2)).strip(),
                    "url": link.group(1),
                    "snippet": re.sub(r'<[^>]+>', '', snippet.group(1)).strip() if snippet else "",
                })
        return results


@app.get("/search")
async def search(q: str = Query(...)):
    """Search web: DDG Lite → Bing fallback."""
    results = await _ddg_lite(q)
    engine = "ddg-lite"
    if not results:
        results = await _bing_search(q)
        engine = "bing"
    return {"query": q, "results": results, "engine": engine, "found": len(results)}


@app.get("/fetch")
async def fetch(url: str = Query(...)):
    """Fetch URL content."""
    try:
        async with httpx.AsyncClient(timeout=20, follow_redirects=True) as c:
            r = await c.get(url, headers={"User-Agent": UA})
            if r.status_code != 200:
                raise HTTPException(r.status_code, f"HTTP {r.status_code}")
            text = re.sub(r'<script[^>]*>.*?</script>', '', r.text, flags=re.DOTALL | re.IGNORECASE)
            text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL | re.IGNORECASE)
            text = re.sub(r'<[^>]+>', ' ', text)
            text = re.sub(r'\s+', ' ', text).strip()
            if len(text) > 8000:
                text = text[:8000] + "..."
            return {"url": url, "content": text, "length": len(text)}
    except Exception as e:
        raise HTTPException(502, str(e))


@app.get("/health")
async def health():
    return {"ok": True}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=9779)
