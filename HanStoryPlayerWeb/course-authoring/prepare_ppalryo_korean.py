from __future__ import annotations

import json
import re
import shutil
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORK = ROOT.parent / ".tmp-ppalryo-ko-work"
IMAGE_ROOT = WORK / "images"
OCR_ROOT = WORK / "ocr"
DETAIL_REF = "https://comic.naver.com/webtoon/detail?titleId=847135&no={episode}&week=wed"

BASES = {
    1: "https://image-comic.pstatic.net/webtoon/847135/1/20260506095115_e217cf2493f0daa5a2a5606f03cfdd1e_IMAG01_",
    2: "https://image-comic.pstatic.net/webtoon/847135/2/20260129125931_e0a17a291c86b300e026f620bc52f22b_IMAG01_",
    3: "https://image-comic.pstatic.net/webtoon/847135/3/20260207104748_6f70642934bdfb46e59bf3d097d428ec_IMAG01_",
    4: "https://image-comic.pstatic.net/webtoon/847135/4/20260119152538_b8b3073de279ba8435e3fd307e00d433_IMAG01_",
    5: "https://image-comic.pstatic.net/webtoon/847135/5/20260124143245_51283ea503c3fb497a1924b8f4293407_IMAG01_",
    6: "https://image-comic.pstatic.net/webtoon/847135/6/20260126170526_e7454c49fe5fea894cd94e7214aa46f7_IMAG01_",
    7: "https://image-comic.pstatic.net/webtoon/847135/7/20260123160340_7119424aaa42bed9882676b364c01ff0_IMAG01_",
    8: "https://image-comic.pstatic.net/webtoon/847135/8/20260123163249_b0064247ba934efd11cf7ecc02aa8190_IMAG01_",
    9: "https://image-comic.pstatic.net/webtoon/847135/9/20260122175116_6a085842a05ff955a69dce688adc3e34_IMAG01_",
    10: "https://image-comic.pstatic.net/webtoon/847135/10/20260219104332_4f6648347f3aaf8290f7c21ce584712f_IMAG01_",
    11: "https://image-comic.pstatic.net/webtoon/847135/11/20260225100505_f36ba808667593336aa12892ce6a2da8_IMAG01_",
    12: "https://image-comic.pstatic.net/webtoon/847135/12/20260123172628_2d41664612dcd2ab56d82de71eda9b7d_IMAG01_",
    13: "https://image-comic.pstatic.net/webtoon/847135/13/20260311152937_9cde441b66ddab9462c5ae88f6061042_IMAG01_",
    14: "https://image-comic.pstatic.net/webtoon/847135/14/20260321104318_1436cf681276713676abd24107288cce_IMAG01_",
    15: "https://image-comic.pstatic.net/webtoon/847135/15/20260122182534_881be2fe7047dde2acdf4a88d1e356dd_IMAG01_",
    16: "https://image-comic.pstatic.net/webtoon/847135/16/20260506195641_055aa8b531f47469723f2d44b784cca8_IMAG01_",
    17: "https://image-comic.pstatic.net/webtoon/847135/17/20260410095217_2153113aa8be829b52df3e6b33236e69_IMAG01_",
    18: "https://image-comic.pstatic.net/webtoon/847135/18/20260123100541_6624087e15518dc238b3f2b5e091d996_IMAG01_",
    19: "https://image-comic.pstatic.net/webtoon/847135/19/20260204153335_b517c80ca98c69a8bd849aa6a445b4a2_IMAG01_",
    20: "https://image-comic.pstatic.net/webtoon/847135/20/20260422224646_8ea0efad5dfc983b066a36b007f1556e_IMAG01_",
    21: "https://image-comic.pstatic.net/webtoon/847135/21/20260223182842_8b3dada524849feb7ccc1fcf1f550cc9_IMAG01_",
    22: "https://image-comic.pstatic.net/webtoon/847135/22/20260224111426_370fd5cf0d5904fa96bb977938e7bdae_IMAG01_",
    23: "https://image-comic.pstatic.net/webtoon/847135/23/20260917211101_3646d52cf481600eaaa860c92d13f2ff_IMAG01_",
    24: "https://image-comic.pstatic.net/webtoon/847135/24/20260311152734_0f47899da4e5f1827f223ba89c11c0c2_IMAG01_",
    25: "https://image-comic.pstatic.net/webtoon/847135/25/20260706191421_ded25cc0cd816314db862df1a25480a5_IMAG01_",
    26: "https://image-comic.pstatic.net/webtoon/847135/26/20260401183754_7c2e85e2f31e511cb44d118be2c26b70_IMAG01_",
    27: "https://image-comic.pstatic.net/webtoon/847135/27/20260520094920_461414bb344f703fdf576d0e0d0897ba_IMAG01_",
    28: "https://image-comic.pstatic.net/webtoon/847135/28/20260519190605_768145c70931f2f36bb29706af251b5a_IMAG01_",
    29: "https://image-comic.pstatic.net/webtoon/847135/29/20260519192300_69113d2f1151de43caace157caaa5384_IMAG01_",
    30: "https://image-comic.pstatic.net/webtoon/847135/30/20260706191510_37c5b855efa6792f8229f98145316271_IMAG01_",
    31: "https://image-comic.pstatic.net/webtoon/847135/31/20260519170741_d634447a880009a872e5a28a4987344d_IMAG01_",
    32: "https://image-comic.pstatic.net/webtoon/847135/32/20260608160415_f9fc9400a46a5b4112030f2e1596f8cd_IMAG01_",
    33: "https://image-comic.pstatic.net/webtoon/847135/33/20260907094933_013fce85ff4c234111d55918af9c79ec_IMAG01_",
    34: "https://image-comic.pstatic.net/webtoon/847135/34/20260608160726_d7a1ccb228ecf2ae8aad1ad70aab271d_IMAG01_",
    35: "https://image-comic.pstatic.net/webtoon/847135/35/20260609115719_2b64eb64d72ba5d1ce238bfb7358b6d3_IMAG01_",
    36: "https://image-comic.pstatic.net/webtoon/847135/36/20260925202601_b6fa54f12168aee8d3c1e0af24d265c9_IMAG01_",
    37: "https://image-comic.pstatic.net/webtoon/847135/37/20260930145132_76dd89f3ad3b15c9c044ee13175a26ef_IMAG01_",
}

HANGUL = re.compile(r"[가-힣]")


def download_one(job: tuple[int, int, str, Path]) -> Path | None:
    episode, number, base, destination = job
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists() and destination.stat().st_size > 1000:
        return destination
    url = f"{base}{number}.jpg"
    result = subprocess.run(
        ["curl", "-k", "-L", "-sS", "--fail", "--max-time", "20", "-A", "Mozilla/5.0", "-e", DETAIL_REF.format(episode=episode), url, "-o", str(destination)],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    if result.returncode or not destination.exists() or destination.stat().st_size < 1000:
        destination.unlink(missing_ok=True)
        return None
    return destination


def ocr_one(path: Path) -> tuple[str, str]:
    outputs = []
    for psm in (11, 6):
        result = subprocess.run(["tesseract", str(path), "stdout", "-l", "kor+eng", "--psm", str(psm)], capture_output=True, text=True, timeout=60)
        outputs.append(result.stdout)
    return str(path), "\n".join(outputs)


def main() -> None:
    WORK.mkdir(parents=True, exist_ok=True)
    IMAGE_ROOT.mkdir(parents=True, exist_ok=True)
    OCR_ROOT.mkdir(parents=True, exist_ok=True)
    jobs = []
    for episode, base in BASES.items():
        for number in range(1, 111):
            jobs.append((episode, number, base, IMAGE_ROOT / f"ep{episode:02d}" / f"{number:03d}.jpg"))
    downloaded: list[Path] = []
    with ThreadPoolExecutor(max_workers=12) as pool:
        futures = [pool.submit(download_one, job) for job in jobs]
        for future in as_completed(futures):
            path = future.result()
            if path is not None:
                downloaded.append(path)
    ocr: dict[str, list[dict[str, str]]] = {str(i): [] for i in BASES}
    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = [pool.submit(ocr_one, path) for path in downloaded]
        for future in as_completed(futures):
            path_text, text = future.result()
            path = Path(path_text)
            episode = str(int(path.parent.name.removeprefix("ep")))
            for line in text.splitlines():
                value = re.sub(r"\s+", " ", line).strip()
                if len(HANGUL.findall(value)) >= 3:
                    ocr[episode].append({"image": path.name, "text": value})
    for episode, rows in ocr.items():
        seen = set(); clean = []
        for row in rows:
            key = row["text"]
            if key not in seen:
                seen.add(key); clean.append(row)
        ocr[episode] = clean
    (OCR_ROOT / "ocr_lines.json").write_text(json.dumps(ocr, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"episodes": len(BASES), "images": len(downloaded), "ocr_lines": sum(len(v) for v in ocr.values()), "ocr_file": str(OCR_ROOT / "ocr_lines.json")}, ensure_ascii=False))


if __name__ == "__main__":
    main()
