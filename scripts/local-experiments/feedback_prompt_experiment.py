"""
K-FitJudge · 피드백 모델(Qwen3-VL-8B) 로컬 프롬프트 실험 스크립트

supabase/functions/evaluate-photo/index.ts 의 buildSystemPrompt()/parseAiCategories()와
동일한 프롬프트·파싱 로직을 그대로 재현한다. 여기서 프롬프트를 바꿔가며 원하는 결과가
나올 때까지 무제한으로(과금 없이) 실험한 다음, 최종 문구만 서버 코드에 반영하면 된다.

주의: 여기서는 무료 티어 모델(Qwen3-VL-8B-Instruct)만 테스트한다. Pro 티어 모델
(Qwen3-VL-235B-A22B-Instruct)은 GPU 한 장(48GB)으로 못 돌린다 — 8B에서 찾은 프롬프트
방향성을 Pro 모델에도 그대로 적용하고, 최종 검증만 실제 서버(HF router)에서 하면 된다.
"""

import json
import re

import torch
from PIL import Image
from transformers import AutoProcessor, Qwen3VLForConditionalGeneration

# ── 1. 여기를 원하는 사진/상황으로 바꿔가며 실험 ──────────────────────────────
IMAGE_PATH = "sample.jpg"  # 테스트할 옷차림 사진 경로
TPO_KO, TPO_EN = "출근", "work"  # work/date/campus/wedding/street 중 하나
INTENT = "classic"  # 'classic' 또는 'experimental'

MODEL_ID = "Qwen/Qwen3-VL-8B-Instruct"

# ── 2. 현재 서버(evaluate-photo/index.ts)와 동일한 채점 기준 ──────────────────
CATEGORY_DEFS = [
    {"key": "color", "max": 20, "labelKo": "색상 조합", "labelEn": "Color Harmony"},
    {"key": "topBottom", "max": 15, "labelKo": "상하의 조화", "labelEn": "Top-Bottom Balance"},
    {"key": "fit", "max": 18, "labelKo": "핏", "labelEn": "Fit"},
    {"key": "shoes", "max": 12, "labelKo": "신발", "labelEn": "Shoes"},
    {"key": "accessory", "max": 10, "labelKo": "액세서리 밸런스", "labelEn": "Accessory Balance"},
    {"key": "tpoFit", "max": 10, "labelKo": "TPO 적합도", "labelEn": "TPO Fit"},
    {"key": "personalColor", "max": 8, "labelKo": "퍼스널컬러 궁합", "labelEn": "Personal Color Match"},
    {"key": "hair", "max": 7, "labelKo": "헤어스타일 궁합", "labelEn": "Hairstyle Match"},
]


def build_system_prompt(tpo_ko: str, tpo_en: str, intent: str) -> str:
    """supabase/functions/evaluate-photo/index.ts 의 buildSystemPrompt()와 동일."""
    rubric = "\n".join(f'- {c["key"]} (max {c["max"]}): {c["labelKo"]} / {c["labelEn"]}' for c in CATEGORY_DEFS)
    intent_note = (
        '이 사용자는 "실험적(아방가르드)" 의도를 선언했다. 과감한 오버사이즈나 믹스매치를 감점 요인이 아니라 '
        "창의성으로 존중해서 관대하게 채점하라."
        if intent == "experimental"
        else '이 사용자는 "클래식" 의도를 선언했다. 기본기(색상 조화, 핏, TPO 적합도)를 기준으로 꼼꼼하게 채점하라.'
    )
    return f"""You are a professional fashion stylist judging an outfit photo for the K-FitJudge app.
The occasion (TPO) is "{tpo_ko}" ({tpo_en}).
{intent_note}

Score the outfit in the photo against exactly these 8 categories. Each category's score must be an integer between 0 and its max:
{rubric}

For each category, also write one short, concrete, natural-sounding note (1 sentence) explaining the score — both in Korean (noteKo) and English (noteEn). If the score is high, the note should read as a compliment; if low, it should read as a specific, actionable suggestion.

Respond with ONLY a single JSON object, no markdown fences, no extra text, in exactly this shape:
{{"categories":{{"color":{{"score":0,"noteKo":"...","noteEn":"..."}},"topBottom":{{"score":0,"noteKo":"...","noteEn":"..."}},"fit":{{"score":0,"noteKo":"...","noteEn":"..."}},"shoes":{{"score":0,"noteKo":"...","noteEn":"..."}},"accessory":{{"score":0,"noteKo":"...","noteEn":"..."}},"tpoFit":{{"score":0,"noteKo":"...","noteEn":"..."}},"personalColor":{{"score":0,"noteKo":"...","noteEn":"..."}},"hair":{{"score":0,"noteKo":"...","noteEn":"..."}}}}}}"""


USER_TEXT = "Judge this outfit photo and respond with the JSON object described above."


def parse_ai_categories(raw: str) -> dict:
    """supabase/functions/evaluate-photo/index.ts 의 parseAiCategories()와 동일한 방식으로 파싱."""
    start, end = raw.find("{"), raw.rfind("}")
    if start == -1 or end == -1 or end < start:
        raise ValueError("JSON 객체를 찾지 못했습니다 — 모델 출력이 형식을 안 지켰어요.")
    parsed = json.loads(raw[start : end + 1])
    return parsed["categories"]


def main():
    system_prompt = build_system_prompt(TPO_KO, TPO_EN, INTENT)

    print("=== SYSTEM PROMPT ===")
    print(system_prompt)
    print("\n=== USER TEXT ===")
    print(USER_TEXT)

    processor = AutoProcessor.from_pretrained(MODEL_ID)
    model = Qwen3VLForConditionalGeneration.from_pretrained(
        MODEL_ID, dtype="auto", device_map="auto"
    )

    image = Image.open(IMAGE_PATH).convert("RGB")
    messages = [
        {"role": "system", "content": system_prompt},
        {
            "role": "user",
            "content": [
                {"type": "image", "image": image},
                {"type": "text", "text": USER_TEXT},
            ],
        },
    ]

    inputs = processor.apply_chat_template(
        messages,
        tokenize=True,
        add_generation_prompt=True,
        return_dict=True,
        return_tensors="pt",
    ).to(model.device)

    with torch.no_grad():
        generated_ids = model.generate(
            **inputs,
            max_new_tokens=1400,
            do_sample=True,
            temperature=0.4,  # 서버(hf.ts)와 동일한 값
        )
    generated_ids = generated_ids[:, inputs["input_ids"].shape[1] :]
    raw_output = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]

    print("\n=== RAW MODEL OUTPUT ===")
    print(raw_output)

    try:
        categories = parse_ai_categories(raw_output)
        print("\n=== PARSED (channel by channel) ===")
        for c in CATEGORY_DEFS:
            entry = categories.get(c["key"], {})
            print(f'{c["key"]:14s} {entry.get("score", "?")}/{c["max"]}  {entry.get("noteKo", "")}')
    except Exception as e:  # noqa: BLE001 - 실험용 스크립트라 그냥 원인만 출력
        print(f"\n[파싱 실패] {e}")


if __name__ == "__main__":
    main()
