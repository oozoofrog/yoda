import importlib.util
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).resolve().parents[1] / 'scripts' / 'build_web_content.py'
spec = importlib.util.spec_from_file_location('build_web_content', MODULE_PATH)
build_web_content = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(build_web_content)


class StaticAssetLinkTests(unittest.TestCase):
    def test_docs_relative_asset_link_resolves_to_site_relative_href(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            asset = root / 'docs' / 'downloads' / 'bundle.zip'
            asset.parent.mkdir(parents=True, exist_ok=True)
            asset.write_bytes(b'zip')

            href = build_web_content.normalize_site_asset_link(
                'docs/downloads/bundle.zip',
                '2026-04-10-swift-official-reference-downloads.md',
                root=root,
            )

            self.assertEqual(href, 'downloads/bundle.zip')

    def test_site_root_asset_link_resolves_when_file_exists_under_docs(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            asset = root / 'docs' / 'downloads' / 'guide.pdf'
            asset.parent.mkdir(parents=True, exist_ok=True)
            asset.write_bytes(b'pdf')

            href = build_web_content.normalize_site_asset_link(
                '/downloads/guide.pdf',
                'README.md',
                root=root,
            )

            self.assertEqual(href, 'downloads/guide.pdf')

    def test_markdown_asset_under_docs_is_still_treated_as_downloadable_file(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            asset = root / 'docs' / 'downloads' / 'notes.md'
            asset.parent.mkdir(parents=True, exist_ok=True)
            asset.write_text('# notes\n')

            href = build_web_content.normalize_site_asset_link(
                'docs/downloads/notes.md',
                'README.md',
                root=root,
            )

            self.assertEqual(href, 'downloads/notes.md')


if __name__ == '__main__':
    unittest.main()
