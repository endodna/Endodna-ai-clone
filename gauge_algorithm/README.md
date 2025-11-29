# Pathogenicity Gauge Algorithm - Worst-Case Implementation

## Overview

This implementation provides a worst-case aggregation algorithm for classifying genetic variant pathogenicity based on ACMG/AMP (American College of Medical Genetics and Genomics/Association for Molecular Pathology) guidelines. The algorithm aggregates multiple variant classifications into a single gauge value represented by three color zones: **green** (low risk), **yellow** (moderate/uncertain risk), and **red** (high risk).

The worst-case approach prioritizes clinical caution by using the most pathogenic classification present in a group of variants. This ensures that even a single pathogenic finding triggers appropriate risk assessment, regardless of other benign findings in the same category.

## ACMG Pathogenicity Categories

The ACMG/AMP guidelines classify genetic variants into five tiers:

1. **Benign (B)** - Variants confidently deemed non-disease-causing (essentially 0% pathogenic chance)
2. **Likely Benign (LB)** - Variants with >90% certainty of being benign (<10% pathogenic chance)
3. **Variant of Uncertain Significance (VUS)** - Variants with insufficient or conflicting evidence; risk is indeterminate (~50% chance)
4. **Likely Pathogenic (LP)** - Variants with >90% certainty of being disease-causing (~90% pathogenic chance)
5. **Pathogenic (P)** - Variants with substantial evidence for disease causation (99-100% pathogenic chance)

These categories can be broadly grouped by risk level:
- **Benign/Likely Benign (B/LB)** - Little to no pathogenic risk
- **Uncertain Significance (VUS)** - Indeterminate risk
- **Pathogenic/Likely Pathogenic (P/LP)** - High pathogenic risk

## Severity Mapping

The algorithm maps ACMG categories to integer severity scores for computational processing:

| Category | Severity Score | Clinical Meaning |
|----------|---------------|------------------|
| Benign | 0 | No pathogenic risk |
| Likely Benign | 1 | Minimal pathogenic risk (<10%) |
| Uncertain Significance (VUS) | 2 | Indeterminate risk (~50%) |
| Likely Pathogenic | 3 | High pathogenic risk (~90%) |
| Pathogenic | 4 | Very high pathogenic risk (99-100%) |

The severity scores are normalized to a 0.0-1.0 scale by dividing by 4.0:
- Benign: 0.0
- Likely Benign: 0.25
- Uncertain Significance: 0.50
- Likely Pathogenic: 0.75
- Pathogenic: 1.0

## Worst-Case Logic

The worst-case (maximum) approach uses the most pathogenic classification in a list to determine the category's risk level. This method aligns with clinical caution principles:

- **If any variant is LP or P** → The category is treated as high-risk (red)
- **If no LP/P variants, but at least one VUS** → The category is treated as moderate risk (yellow)
- **If all variants are benign or likely benign** → The category is low risk (green)

The algorithm effectively maps to the highest severity score among the variants:
- Maximum severity 0-1 → Green zone
- Maximum severity 2 → Yellow zone
- Maximum severity 3-4 → Red zone

This approach ensures that a single pathogenic finding warrants appropriate clinical attention, even when accompanied by multiple benign findings.

## Color Thresholds

The algorithm maps aggregated severity scores to three color zones:

### Green (Safe/Benign Zone)
- **Condition**: Maximum severity ≤ 1
- **Meaning**: No significant pathogenic risk
- **Categories**: All variants are benign or likely benign
- **Normalized Score**: 0.0 - 0.25

### Yellow (Moderate/Uncertain Zone)
- **Condition**: Maximum severity = 2
- **Meaning**: Intermediate risk or uncertainty
- **Categories**: At least one VUS present, but no LP/P variants
- **Normalized Score**: 0.50

### Red (High-Risk Pathogenic Zone)
- **Condition**: Maximum severity ≥ 3
- **Meaning**: Significant pathogenic evidence
- **Categories**: At least one likely pathogenic or pathogenic variant present
- **Normalized Score**: 0.75 - 1.0

This threshold scheme aligns with accepted practice of grouping ACMG categories into three risk levels: benign (green), uncertain (yellow), and pathogenic (red).

## Usage Examples

### Basic Usage

```python
from main import gauge_from_acmg_labels

# Example 1: All benign variants → Green
labels = ["benign", "benign", "likely benign"]
result = gauge_from_acmg_labels(labels)
# Returns: {'color': 'green', 'max_severity': 1, 'normalized_score': 0.25, 'unknown_labels': []}

# Example 2: Mix of benign and VUS → Yellow
labels = ["benign", "likely benign", "uncertain significance"]
result = gauge_from_acmg_labels(labels)
# Returns: {'color': 'yellow', 'max_severity': 2, 'normalized_score': 0.5, 'unknown_labels': []}

# Example 3: Presence of LP/P → Red
labels = ["benign", "likely benign", "likely pathogenic"]
result = gauge_from_acmg_labels(labels)
# Returns: {'color': 'red', 'max_severity': 3, 'normalized_score': 0.75, 'unknown_labels': []}

# Example 4: Pathogenic variant overrides benign → Red
labels = ["benign", "benign", "pathogenic"]
result = gauge_from_acmg_labels(labels)
# Returns: {'color': 'red', 'max_severity': 4, 'normalized_score': 1.0, 'unknown_labels': []}
```

### Edge Cases

```python
# Empty list → Green (no variants = no risk)
result = gauge_from_acmg_labels([])
# Returns: {'color': 'green', 'max_severity': 0, 'normalized_score': 0.0, 'unknown_labels': []}

# Unknown labels are tracked separately
labels = ["benign", "unknown_label", "vus"]
result = gauge_from_acmg_labels(labels)
# Returns: {'color': 'yellow', 'max_severity': 2, 'normalized_score': 0.5, 'unknown_labels': ['unknown_label']}

# All unknown labels → Yellow (uncertainty)
labels = ["unknown1", "unknown2"]
result = gauge_from_acmg_labels(labels)
# Returns: {'color': 'yellow', 'max_severity': None, 'normalized_score': None, 'unknown_labels': ['unknown1', 'unknown2']}
```

### Case-Insensitive Input

The algorithm handles case-insensitive input and common variations:

```python
# Case variations are normalized
labels = ["BENIGN", "Likely Benign", "uncertain significance", "VUS"]
result = gauge_from_acmg_labels(labels)
# All labels are recognized and processed correctly
```

## Theoretical Background

The worst-case aggregation approach is based on the principle of clinical caution in genetic variant interpretation. According to ACMG/AMP guidelines:

- **"Likely pathogenic"** and **"likely benign"** variants are intended to mean roughly >90% certainty of being pathogenic or benign, respectively
- A **pathogenic** variant is essentially regarded as 99-100% likely to cause disease
- A **benign** variant has virtually no chance of pathogenicity (~0%)
- A **VUS** sits in the middle, essentially uncertain, often interpreted as ~50/50 odds

The worst-case method ensures that:
1. A single pathogenic finding is not diluted by multiple benign findings
2. Clinical decision-making prioritizes patient safety
3. The most conservative interpretation is applied when multiple variants are present

This approach is particularly important in clinical settings where missing a pathogenic variant could have serious consequences, while false positives can be further evaluated through additional testing or clinical correlation.

## Algorithm Implementation Details

The algorithm performs the following steps:

1. **Input Validation**: Checks if the input list is empty
2. **Label Normalization**: Converts all labels to lowercase and strips whitespace
3. **Severity Mapping**: Maps recognized ACMG labels to severity scores (0-4)
4. **Unknown Label Tracking**: Collects unrecognized labels separately
5. **Maximum Severity Calculation**: Finds the highest severity score among recognized variants
6. **Normalization**: Converts severity score to 0.0-1.0 scale
7. **Color Assignment**: Maps maximum severity to color zone (green/yellow/red)
8. **Result Compilation**: Returns dictionary with color, severity, normalized score, and unknown labels



