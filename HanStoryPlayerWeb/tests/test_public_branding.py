import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class PublicBrandingTests(unittest.TestCase):
    def test_visible_header_is_only_hanstudio(self):
        index = (ROOT / "index.html").read_text(encoding="utf-8")
        branding = (ROOT / "src/branding.js").read_text(encoding="utf-8")
        self.assertIn("<title>HanStudio</title>", index)
        self.assertIn('heroTitle: "HanStudio"', branding)
        self.assertIn('heroSubtitle: ""', branding)
        self.assertIn('eyebrow: ""', branding)

    def test_footer_contains_only_requested_message(self):
        index = (ROOT / "index.html").read_text(encoding="utf-8")
        self.assertIn("<footer>Sin anuncios</footer>", index)
        self.assertNotIn("Tú decides si sincronizas tu progreso", index)

    def test_pwa_uses_the_same_name(self):
        manifest = json.loads((ROOT / "manifest.webmanifest").read_text(encoding="utf-8"))
        self.assertEqual(manifest["name"], "HanStudio")
        self.assertEqual(manifest["short_name"], "HanStudio")


if __name__ == "__main__":
    unittest.main()
