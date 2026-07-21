# 로컬 프롬프트 실험 스크립트

SSH로 접속하는 GPU 서버(48GB VRAM)에서, 실제 서비스에 배포하기 전에 프롬프트를 과금 없이
무제한으로 튜닝해보기 위한 스크립트입니다. `supabase/functions/evaluate-photo/index.ts`,
`supabase/functions/generate-image-edit/index.ts`, `supabase/functions/_shared/fal.ts`와
동일한 프롬프트 구성 로직을 재현하고 있으니, 여기서 최적의 문구를 찾은 다음 해당 서버 코드에
그대로 반영하면 됩니다.

## 설치

```bash
python -m venv .venv
source .venv/bin/activate

# GPU에 맞는 PyTorch 먼저 설치 (CUDA 버전은 `nvidia-smi`로 확인)
pip install torch --index-url https://download.pytorch.org/whl/cu121

pip install -U transformers accelerate pillow
pip install -U diffusers

# (선택) 다운로드 속도/레이트리밋 완화 — 예전에 만든 HF_TOKEN(Inference 권한) 재사용 가능
huggingface-cli login
```

- `transformers`에 `Qwen3VLForConditionalGeneration`이 없다는 에러가 나면 최신 릴리스에
  아직 안 올라온 것이니 소스에서 설치하세요: `pip install -U git+https://github.com/huggingface/transformers`
- `diffusers`에 `QwenImageEditPlusPipeline`이 없다는 에러도 마찬가지:
  `pip install -U git+https://github.com/huggingface/diffusers`
- 두 모델을 처음 받으면 디스크 공간이 꽤 필요합니다(8B 모델 ~16GB, Qwen-Image-Edit-2509
  ~40GB대) — 여유 공간 60~80GB 정도 확보해두세요. 캐시 위치는 기본 `~/.cache/huggingface`.

## 사용

1. `feedback_prompt_experiment.py` / `image_edit_prompt_experiment.py` 상단의 `IMAGE_PATH`를
   테스트할 사진 경로로 바꾸기
2. 프롬프트 관련 부분(시스템 프롬프트, PRESERVE_CLAUSE, NEGATIVE_PROMPT, GUIDANCE_SCALE 등)을
   원하는 대로 수정하며 반복 실행
3. 마음에 드는 결과가 나오면, 바뀐 부분을 실제 서버 코드에 그대로 옮기고
   ```bash
   npx supabase functions deploy evaluate-photo        # 피드백 프롬프트를 바꿨다면
   npx supabase functions deploy generate-image-edit    # 이미지 편집 프롬프트를 바꿨다면
   ```

## 알아둘 점

- `Qwen3-VL-235B-A22B-Instruct`(Pro 피드백 모델)는 48GB GPU 한 장으로 못 돌립니다. 8B에서
  찾은 프롬프트 방향성을 그대로 적용하고, 최종 확인만 실제 서버(HF router)에서 하세요.
- 로컬 `transformers`/`diffusers` 추론과 fal.ai/HF router가 서빙하는 방식이 내부적으로
  100% 동일하지는 않을 수 있습니다(양자화, 스케줄러 기본값 등). 최종 프롬프트는 실제
  프로덕션 엔드포인트에서 한 번 더 확인하는 걸 추천합니다.
