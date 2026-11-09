"""Real-browser checks for the static portfolio. No external requests in tests."""
import argparse
import functools
import http.server
import pathlib
import threading
import unittest

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[1]


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_):
        pass


class PortfolioSmoke(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = http.server.ThreadingHTTPServer(
            ("127.0.0.1", 0), functools.partial(QuietHandler, directory=str(ROOT))
        )
        cls.thread = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.thread.start()
        cls.url = f"http://127.0.0.1:{cls.server.server_port}/"
        cls.pw = sync_playwright().start()
        cls.browser = cls.pw.chromium.launch(channel="msedge", headless=True)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()
        cls.server.shutdown()
        cls.server.server_close()
        cls.thread.join()

    def page(self, **kwargs):
        context = self.browser.new_context(**kwargs)
        self.addCleanup(context.close)
        # Offline dependency boundary: local HTML/CSS/JS run unchanged.
        context.route("**/*", lambda route: route.continue_()
                      if route.request.url.startswith(self.url) else route.abort())
        page = context.new_page()
        page.goto(self.url, wait_until="load")
        page.wait_for_timeout(1200)
        return page

    def test_nojs_mobile_content_and_navigation_are_usable(self):
        page = self.page(java_script_enabled=False, viewport={"width": 390, "height": 844})
        self.assertFalse(page.locator("#boot").is_visible(), "No-JS preloader must not cover content")
        self.assertTrue(page.locator(".hero__title").is_visible())
        self.assertTrue(page.locator(".nojs-nav a[href='#work']").is_visible())
        self.assertFalse(page.locator("#burger").is_visible())
        self.assertFalse(page.locator(".filters").is_visible())

    def test_mobile_menu_keyboard_focus_and_escape(self):
        page = self.page(viewport={"width": 390, "height": 844}, reduced_motion="reduce")
        page.locator("#burger").focus()
        page.keyboard.press("Enter")
        self.assertEqual(page.locator("#burger").get_attribute("aria-expanded"), "true")
        self.assertTrue(page.locator("#mobile-nav a").first.evaluate("el => el === document.activeElement"))
        page.keyboard.press("Escape")
        self.assertFalse(page.locator("#mobile-nav").is_visible())
        self.assertTrue(page.locator("#burger").evaluate("el => el === document.activeElement"))

    def test_reduced_motion_change_stops_canvas(self):
        page = self.page(viewport={"width": 1440, "height": 1000})
        page.emulate_media(reduced_motion="reduce")
        page.wait_for_timeout(250)
        before = page.locator("canvas").evaluate("el => el.toDataURL()")
        page.wait_for_timeout(900)
        self.assertTrue(before == page.locator("canvas").evaluate("el => el.toDataURL()"),
                        "Canvas must stop changing when reduced motion is enabled")

    def test_script_unavailable_preserves_content(self):
        page = self.page(viewport={"width": 390, "height": 844})
        page.route("**/app.js", lambda route: route.abort())
        page.reload(wait_until="load")
        self.assertFalse(page.locator("#boot").is_visible())
        self.assertEqual(page.locator(".hero__title").evaluate("el => getComputedStyle(el.firstElementChild).opacity"), "1")
        self.assertFalse(page.locator(".filters").is_visible())

    def test_mobile_link_selection_and_desktop_resize_close_menu(self):
        page = self.page(viewport={"width": 390, "height": 844}, reduced_motion="reduce")
        page.locator("#burger").click()
        page.locator('#mobile-nav a[href="#work"]').click()
        self.assertEqual(page.evaluate("location.hash"), "#work")
        self.assertFalse(page.locator("#mobile-nav").is_visible())
        page.locator("#burger").click()
        page.set_viewport_size({"width": 1440, "height": 1000})
        page.wait_for_timeout(250)
        self.assertFalse(page.locator("#mobile-nav").is_visible())
        self.assertTrue(page.locator(".nav a").first.evaluate("el => el === document.activeElement"))

    def test_filters_and_counts_match_rendered_cards(self):
        page = self.page(reduced_motion="reduce")
        total = page.locator(".repo").count()
        self.assertEqual(total, 27)
        for button in page.locator(".filter").all():
            domain = button.get_attribute("data-filter")
            expected = total if domain == "all" else page.locator(f'.repo[data-domain="{domain}"]').count()
            self.assertEqual(int(button.locator(".filter__n").inner_text()), expected)
            button.click()
            self.assertEqual(page.locator(".repo:visible").count(), expected)
            self.assertEqual(button.get_attribute("aria-pressed"), "true")
            self.assertIn(str(expected), page.locator("#filter-status").inner_text())

    def test_local_links_assets_console_and_layout(self):
        for width in (320, 390, 768, 1440):
            page = self.page(viewport={"width": width, "height": 900}, reduced_motion="reduce")
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.reload(wait_until="load")
            for href in page.locator('a[href^="#"]').evaluate_all("els => els.map(el => el.getAttribute('href'))"):
                self.assertEqual(page.locator(href).count(), 1, href)
            self.assertEqual(page.locator(".repo__name a").count(), 27)
            page.locator(".plate__img").scroll_into_view_if_needed()
            page.wait_for_function("document.querySelector('.plate__img').complete && document.querySelector('.plate__img').naturalWidth > 0")
            self.assertTrue(page.locator(".plate__img").evaluate("el => el.complete && el.naturalWidth > 0"))
            self.assertLessEqual(page.evaluate("document.documentElement.scrollWidth"), width)
            self.assertEqual(errors, [])


def capture(output):
    PortfolioSmoke.setUpClass()
    try:
        output.mkdir(parents=True, exist_ok=True)
        for label, width, height in (("desktop", 1440, 1000), ("mobile", 390, 844)):
            context = PortfolioSmoke.browser.new_context(viewport={"width": width, "height": height}, reduced_motion="reduce")
            page = context.new_page()
            page.goto(PortfolioSmoke.url, wait_until="load")
            page.evaluate("document.fonts.ready")
            page.wait_for_timeout(1500)
            # Scroll through actual sections so lazy images/reveals settle.
            for section in page.locator("main section").all():
                section.scroll_into_view_if_needed()
                page.wait_for_timeout(150)
            page.evaluate("window.scrollTo(0, 0)")
            page.wait_for_timeout(300)
            page.screenshot(path=str(output / f"{label}.png"), full_page=True)
            page.screenshot(path=str(output / f"{label}-hero.png"))
            if label == "desktop":
                page.locator("#work").screenshot(path=str(output / "selected-work.png"))
            print(f"Captured {label}: {width}x{height}, page height {page.evaluate('document.body.scrollHeight')}")
            context.close()
    finally:
        PortfolioSmoke.tearDownClass()


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--capture", type=pathlib.Path)
    args, rest = parser.parse_known_args()
    if args.capture:
        capture(args.capture.resolve())
    else:
        unittest.main(argv=[__file__, *rest])
