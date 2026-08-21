from pathlib import Path

from PIL import Image


SOURCE = Path("/home/ubuntu/webdev-static-assets/liga-toto-talho-app-icon-cristal.png")
OUTPUT_DIRECTORY = Path("/home/ubuntu/webdev-static-assets")


def main() -> None:
    with Image.open(SOURCE) as original:
        image = original.convert("RGBA")
        for size in (192, 512):
            output = image.resize((size, size), Image.Resampling.LANCZOS)
            output.save(
                OUTPUT_DIRECTORY / f"liga-toto-talho-app-icon-cristal-android-v3-{size}.png",
                format="PNG",
                optimize=True,
            )


if __name__ == "__main__":
    main()
