from django.core.cache import cache
from django.utils import timezone
import feedparser


class NewsService:
    CACHE_TIMEOUT = 60 * 60 * 3  # 3 hours

    HEALTHCARE_FEEDS = [
        "https://medlineplus.gov/feeds/whatsnew.xml",
    ]

    CANCER_FEEDS = [
        "https://www.cancer.gov/publishedcontent/rss/syndication/rss/ncinewsreleases.rss",
    ]

    def _parse_feed(self, url, limit=10):
        feed = feedparser.parse(url)
        items = []

        for entry in feed.entries[:limit]:
            items.append({
                "title": getattr(entry, "title", "Untitled"),
                "source": getattr(feed.feed, "title", "Unknown source"),
                "url": getattr(entry, "link", ""),
                "published_at": getattr(entry, "published", "") or getattr(entry, "updated", ""),
                "summary": getattr(entry, "summary", ""),
            })

        return items

    def _collect_feeds(self, urls, category):
        all_items = []
        for url in urls:
            try:
                all_items.extend(self._parse_feed(url, limit=10))
            except Exception:
                continue

        # remove empties
        all_items = [item for item in all_items if item.get("title")]

        # simple dedupe by title+url
        seen = set()
        unique_items = []
        for item in all_items:
            key = (item.get("title", "").strip(), item.get("url", "").strip())
            if key in seen:
                continue
            seen.add(key)
            unique_items.append(item)

        return {
            "category": category,
            "refreshed_at": timezone.now().isoformat(),
            "items": unique_items[:10],
        }

    def get_healthcare_news(self):
        cache_key = "medholo_healthcare_news_real"
        cached = cache.get(cache_key)
        if cached:
            return cached

        data = self._collect_feeds(self.HEALTHCARE_FEEDS, "healthcare")
        cache.set(cache_key, data, self.CACHE_TIMEOUT)
        return data

    def get_cancer_news(self):
        cache_key = "medholo_cancer_news_real"
        cached = cache.get(cache_key)
        if cached:
            return cached

        data = self._collect_feeds(self.CANCER_FEEDS, "cancer")
        cache.set(cache_key, data, self.CACHE_TIMEOUT)
        return data