"""
K-FitJudge · Pro 이미지 개선 모델(Qwen-Image-Edit-2509) 로컬 프롬프트 실험 스크립트

supabase/functions/generate-image-edit/index.ts 와 동일한 프롬프트 구성 로직을 재현한다.
여기서 prompt/negative_prompt/guidance_scale을 바꿔가며 "옷만 바뀌고 얼굴·배경은
그대로인" 결과가 나올 때까지 무제한으로(과금 없이) 실험한 다음, 최종 값만 서버 코드
(_shared/fal.ts, generate-image-edit/index.ts)에 반영하면 된다.

주의: 48GB GPU에서 빠듯할 수 있다. 메모리 부족(OOM)이 나면 아래 pipe.enable_model_cpu_offload()
줄의 주석을 해제해서 일부 구성요소를 CPU로 내려라(속도는 느려지지만 메모리는 훨씬 절약된다).
"""

import torch
from diffusers import QwenImageEditPlusPipeline
from diffusers.utils import load_image

# ── 1. 여기를 원하는 사진/피드백으로 바꿔가며 실험 ────────────────────────────
IMAGE_PATH = "sample.jpg"
OUTPUT_PATH = "edited_output.jpg"
SEED = 42  # 같은 시드로 프롬프트만 바꿔야 결과를 공정하게 비교할 수 있다

# evaluations.improvements 에서 옷 관련 카테고리만 뽑은 것이라고 가정 (실제로는 AI가 생성)
# 여기 문장들만 바꿔가며 실험해도 되고, 아래 PROMPT를 통째로 직접 고쳐도 된다.
SAMPLE_IMPROVEMENTS_EN = [
    "The shoe color stands apart from the rest. Matching it to your outerwear or bottoms ties the look together.",
    "The top and bottom tones clash slightly. Muting one side to neutral improves the harmony.",
]

# ── 2. 현재 서버(generate-image-edit/index.ts)와 동일한 프롬프트 구성 ─────────
PRESERVE_CLAUSE = (
    "This is a garment-only edit — imagine only the clothing layer is being swapped. "
    "The person's face, facial features, skin tone, hairstyle, head, body shape, and pose, "
    "and the entire background, must stay pixel-identical to the original photo. "
    "Do not change anything except the clothing described below."
)

NEGATIVE_PROMPT = (
    "different face, changed facial features, different person, changed hairstyle, "
    "changed head, changed background, changed pose, changed body shape, extra limbs, "
    "blurry, distorted, watermark, text"
)

# _shared/fal.ts 의 guidance_scale과 이름은 다르지만(diffusers는 true_cfg_scale) 같은 역할.
GUIDANCE_SCALE = 9.0


def build_prompt(instructions: list[str]) -> str:
    """generate-image-edit/index.ts 의 prompt 구성과 동일."""
    if instructions:
        numbered = " ".join(f"{i + 1}) {text}" for i, text in enumerate(instructions[:3]))
        return f"{PRESERVE_CLAUSE} Apply only these changes: {numbered} Nothing else should change."
    return f"{PRESERVE_CLAUSE} Subtly refine the outfit's color harmony and fit only."


def main():
    prompt = build_prompt(SAMPLE_IMPROVEMENTS_EN)

    print("=== PROMPT ===")
    print(prompt)
    print("\n=== NEGATIVE PROMPT ===")
    print(NEGATIVE_PROMPT)
    print(f"\n=== guidance_scale(true_cfg_scale) = {GUIDANCE_SCALE} ===")

    pipe = QwenImageEditPlusPipeline.from_pretrained(
        "Qwen/Qwen-Image-Edit-2509", torch_dtype=torch.bfloat16
    )
    pipe.to("cuda")
    # 메모리가 부족하면 아래 줄 주석 해제 (텍스트 인코더 등을 CPU로 오프로드, 속도는 느려짐)
    # pipe.enable_model_cpu_offload()

    image = load_image(IMAGE_PATH).convert("RGB")

    result = pipe(
        image=[image],
        prompt=prompt,
        negative_prompt=NEGATIVE_PROMPT,
        true_cfg_scale=GUIDANCE_SCALE,
        num_inference_steps=50,
        generator=torch.Generator(device="cuda").manual_seed(SEED),
        num_images_per_prompt=1,
    )

    result.images[0].save(OUTPUT_PATH)
    print(f"\n저장됨: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
