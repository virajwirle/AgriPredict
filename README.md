# AgriPredict

AgriPredict is a multi-crop plant leaf disease detection project.

The project develops crop-specific deep-learning models for identifying
plant leaf diseases from images, with reliability-aware prediction for
handling uncertain inputs.

## Current Progress

| Crop | Status |
| --- | --- |
| Apple | Model V1 completed |
| Potato | In progress |
| Maize | In progress |
| Mango | In progress |

## Apple Model V1

- Architecture: ResNet50 + Self-Attention
- Classes: 8
- Internal Test Accuracy: 96.22%
- Internal Test Macro-F1: 0.9676
- OOD AUROC: 0.9631
- Reliability: Global cosine kNN

## Repository Contents

- Dataset preparation notebooks
- Training notebooks
- Evaluation notebooks
- Reliability/OOD experiments
- Reusable source code
- Project documentation

Large datasets, checkpoints, and deployment weights are excluded from GitHub.
Deployment-ready model artifacts are stored separately on Hugging Face.
