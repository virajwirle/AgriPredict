# Crop Dataset and Model Reference

Prepared from the dataset inventory, cleaning, split, training, and evaluation results shared in the AgriPredict chat. Paths below are Google Drive paths used in Colab.

## Summary

| Crop | Source archive in Drive | Images after cleaning | Split (train / validation / internal test) | Internal-test accuracy | Balanced accuracy | Macro-F1 |
|---|---|---:|---:|---:|---:|---:|
| Cotton | `final_year_project/cotton/SAR-CLD-2024 A Comprehensive Dataset for Cotton Leaf Disease Detection.zip` | 1,648 | 1,149 / 249 / 250 | 92.80% | 94.35% | 93.06% |
| Groundnut | `final_year_project/groundnut/Raw_Data.zip` | 3,036 | 2,125 / 455 / 456 | 94.96% | 95.69% | 96.11% |

No public download URL was supplied in the chat for either archive. The dataset source recorded here is the archive name and its Drive location.

## Cotton

### Source and folders

- Archive: `SAR-CLD-2024 A Comprehensive Dataset for Cotton Leaf Disease Detection.zip`
- Drive archive path: `/content/drive/MyDrive/final_year_project/cotton/SAR-CLD-2024 A Comprehensive Dataset for Cotton Leaf Disease Detection.zip`
- Extracted dataset folder: `/content/drive/MyDrive/final_year_project/cotton/dataset`
- Original inventory: 1,743 images; all 1,743 opened successfully.

### Supported classes and cleaned counts

| Class | Images after duplicate cleaning |
|---|---:|
| Bacterial Blight | 250 |
| Curl Virus | 424 |
| Healthy Leaf | 179 |
| Leaf Hopper Jassids | 225 |
| Leaf Redding | 570 |
| **Total** | **1,648** |

Initial inventory counts were 250, 431, 259, 225, and 578 respectively (1,743 total). Exact and near-duplicate review moved 95 files out of the active dataset; the files were preserved in review folders. Five exact duplicate groups had conflicting labels, and all copies from those groups were excluded. Eleven likely augmentation-family links were kept together during splitting.

### Split counts

| Class | Train | Validation | Internal test | Total |
|---|---:|---:|---:|---:|
| Bacterial Blight | 174 | 38 | 38 | 250 |
| Curl Virus | 294 | 65 | 65 | 424 |
| Healthy Leaf | 125 | 27 | 27 | 179 |
| Leaf Hopper Jassids | 156 | 34 | 35 | 225 |
| Leaf Redding | 400 | 85 | 85 | 570 |
| **Total** | **1,149** | **249** | **250** | **1,648** |

The split was approximately 70/15/15, stratified by class, with detected duplicate/augmentation groups kept together. The internal test set was evaluated after selecting the best validation checkpoint.

### Internal-test result

- Accuracy: 92.80%
- Balanced accuracy: 94.35%
- Macro-F1: 93.06%
- The strongest confusion was between Leaf Hopper Jassids and Leaf Redding; detailed metrics are in the saved report.

### Cotton OOD status

PlantDoc images were used for a light, threshold-based OOD assessment without OOD fine-tuning. The frozen policy was also evaluated on PlantDoc and the cotton internal test set. The results showed limited rejection of non-cotton leaves, so they should not be described as reliable rejection of all unfamiliar crops. Reports and threshold configuration are saved in the cotton Drive folder.

## Groundnut

### Source and folders

- Archive: `Raw_Data.zip`
- Drive archive path: `/content/drive/MyDrive/final_year_project/groundnut/Raw_Data.zip`
- Extracted dataset folder: `/content/drive/MyDrive/final_year_project/groundnut/dataset/Raw_Data`
- Original inventory: 3,058 images; all 3,058 opened successfully, at 1,200 × 800 pixels.

### Supported classes and cleaned counts

| Class | Images after duplicate cleaning |
|---|---:|
| early_leaf_spot | 878 |
| healthy leaf | 916 |
| late leaf spot | 689 |
| nutrition deficiency | 328 |
| rust | 225 |
| **Total** | **3,036** |

The exact-byte scan found no duplicate groups. The perceptual-hash review identified 24 candidate pairs; after visual review, these were treated as 19 duplicate groups. Twenty-two extra copies were moved to `near_duplicate_review`, leaving 3,036 active images. The augmentation-family scan found zero candidates at the tested settings. The post-split audit found zero exact or pHash near-duplicate pairs crossing splits.

### Split counts

| Class | Train | Validation | Internal test | Total |
|---|---:|---:|---:|---:|
| early_leaf_spot | 615 | 131 | 132 | 878 |
| healthy leaf | 641 | 137 | 138 | 916 |
| late leaf spot | 482 | 104 | 103 | 689 |
| nutrition deficiency | 230 | 49 | 49 | 328 |
| rust | 157 | 34 | 34 | 225 |
| **Total** | **2,125** | **455** | **456** | **3,036** |

The split was stratified at approximately 70/15/15. Training used a balanced sampler because the classes are imbalanced. The internal test set was kept out of training and validation-based model selection.

### Internal-test result

- Selected checkpoint: epoch 21
- Accuracy: 94.96%
- Balanced accuracy: 95.69%
- Macro-F1: 96.11%
- Misclassified images: 23 of 456
- Most errors were between early_leaf_spot and healthy leaf. The other three classes had strong test performance in this evaluation.

### Groundnut OOD status

Groundnut OOD evaluation has not been run yet. PlantDoc was identified as a possible source of other-crop leaf images, but its inventory and duplicate check against groundnut were not completed. The groundnut classifier currently predicts one of its five supported classes for any uploaded image; it does not yet reject OOD inputs.

## Saved reports and manifests

Groundnut files reported in the chat:

- `inventory_report.csv`
- `exact_duplicate_manifest.csv`
- `conflicting_label_duplicates.csv`
- `near_duplicate_candidates.csv`
- `near_duplicate_cleanup_log.csv`
- `augmentation_family_candidates.csv`
- `split_manifest.csv`
- `split_manifest_with_cache.csv`
- `split_config.json`
- `preprocessing_config.json`
- `model_config.json`
- `training_history.csv`
- `checkpoints/best_model.pt`
- `checkpoints/last_checkpoint.pt`
- `internal_test_report.json`
- `internal_test_confusion_matrix.csv`
- `internal_test_misclassified.csv`

These are under `/content/drive/MyDrive/final_year_project/groundnut/` in the Colab Drive.

Cotton reports and manifests are under `/content/drive/MyDrive/final_year_project/cotton/`; files specifically reported include `inventory_report.csv`, `split_manifest.csv`, `split_config.json`, `internal_test_report.json`, `internal_test_confusion_matrix.csv`, and `internal_test_misclassified.csv`.

## Interpretation notes

- The quoted performance metrics apply to the internal test sets described above, not to every field or camera condition.
- Dataset counts are after the reviewed duplicate cleanup and before any future OOD or unsupported-condition data are added.
- The train, validation, and internal-test class counts are based on the manifests and outputs shared in the chat.
- No public dataset URLs or publisher citations were supplied here; use the dataset archive's original source citation in a formal report if one is available from its provider.
