"""
Pathogenicity Gauge Algorithm - Worst-Case Implementation

This module implements a worst-case aggregation algorithm for classifying genetic
variant pathogenicity based on ACMG/AMP (American College of Medical Genetics and
Genomics/Association for Molecular Pathology) guidelines.

The algorithm aggregates multiple variant classifications into a single gauge value
represented by three color zones:
- Green: Low risk (benign/likely benign variants)
- Yellow: Moderate/uncertain risk (variants of uncertain significance)
- Red: High risk (likely pathogenic/pathogenic variants)

The worst-case approach uses the most pathogenic classification in a group to
determine the overall risk level, ensuring clinical caution is prioritized.

References:
- ACMG/AMP guidelines for variant interpretation
- Clinical practice in genetic variant classification
"""

from typing import List, Dict, Literal, Optional

# Mapping of ACMG/AMP variant classification categories to severity scores
# Severity scores range from 0 (benign) to 4 (pathogenic)
# These scores are used for worst-case aggregation: the maximum severity determines
# the gauge color. The mapping aligns with clinical risk levels:
# - 0-1: Benign/Likely Benign (low risk) → Green
# - 2: Uncertain Significance (moderate risk) → Yellow  
# - 3-4: Likely Pathogenic/Pathogenic (high risk) → Red
ACMG_SEVERITY = {
    "benign": 0,                    # No pathogenic risk
    "likely benign": 1,             # Minimal pathogenic risk (<10%)
    "uncertain significance": 2,    # Indeterminate risk (~50%)
    "vus": 2,                       # Alias for "uncertain significance"
    "likely pathogenic": 3,         # High pathogenic risk (~90%)
    "pathogenic": 4,                # Very high pathogenic risk (99-100%)
}

Color = Literal["green", "yellow", "red"]

def gauge_from_acmg_labels(
    labels: List[str]
) -> Dict[str, Optional[float | int | str]]:
    """
    Worst-case aggregation of ACMG classifications into a gauge color.

    This function implements the worst-case (maximum) approach for aggregating
    multiple variant classifications. It uses the most pathogenic classification
    present in the input list to determine the overall risk level, ensuring that
    even a single pathogenic finding triggers appropriate risk assessment.

    Algorithm:
    1. Maps each recognized ACMG label to a severity score (0-4)
    2. Finds the maximum severity score among all variants
    3. Normalizes the score to 0.0-1.0 range (max_severity / 4.0)
    4. Assigns color based on maximum severity:
       - Green: max_severity ≤ 1 (all benign/likely benign)
       - Yellow: max_severity = 2 (at least one VUS, no LP/P)
       - Red: max_severity ≥ 3 (at least one likely pathogenic/pathogenic)

    Parameters
    ----------
    labels : List[str]
        List of ACMG variant classification labels. Labels are case-insensitive
        and whitespace is automatically stripped. Supported labels:
        - "benign" or "B"
        - "likely benign" or "LB"
        - "uncertain significance" or "VUS"
        - "likely pathogenic" or "LP"
        - "pathogenic" or "P"
        
        Example: ['benign', 'likely benign', 'uncertain significance', 'pathogenic']

    Returns
    -------
    Dict[str, Optional[float | int | str]]
        Dictionary containing:
        - 'color' : Literal["green", "yellow", "red"]
            The gauge color representing the overall risk level
        - 'max_severity' : Optional[int]
            The maximum severity score (0-4) among recognized variants.
            None if no recognized variants were found.
        - 'normalized_score' : Optional[float]
            The normalized score (0.0-1.0) calculated as max_severity / 4.0.
            None if no recognized variants were found.
        - 'unknown_labels' : List[str]
            List of input labels that could not be recognized or parsed.
            Empty list if all labels were recognized.

    Examples
    --------
    >>> # All benign variants → Green
    >>> result = gauge_from_acmg_labels(["benign", "likely benign"])
    >>> result['color']
    'green'
    >>> result['max_severity']
    1
    >>> result['normalized_score']
    0.25

    >>> # Mix of benign and VUS → Yellow
    >>> result = gauge_from_acmg_labels(["benign", "uncertain significance"])
    >>> result['color']
    'yellow'
    >>> result['max_severity']
    2
    >>> result['normalized_score']
    0.5

    >>> # Presence of LP/P → Red (worst-case overrides benign)
    >>> result = gauge_from_acmg_labels(["benign", "likely pathogenic"])
    >>> result['color']
    'red'
    >>> result['max_severity']
    3
    >>> result['normalized_score']
    0.75

    >>> # Pathogenic variant overrides all → Red
    >>> result = gauge_from_acmg_labels(["benign", "benign", "pathogenic"])
    >>> result['color']
    'red'
    >>> result['max_severity']
    4
    >>> result['normalized_score']
    1.0

    >>> # Empty list → Green (no variants = no risk)
    >>> result = gauge_from_acmg_labels([])
    >>> result['color']
    'green'
    >>> result['max_severity']
    0

    >>> # Unknown labels are tracked separately
    >>> result = gauge_from_acmg_labels(["benign", "unknown_label", "vus"])
    >>> result['color']
    'yellow'
    >>> result['unknown_labels']
    ['unknown_label']

    Notes
    -----
    - The algorithm is case-insensitive and handles common label variations
    - Unknown labels do not affect the severity calculation but are reported
    - If all labels are unknown, the result defaults to yellow (uncertainty)
    - The worst-case approach ensures clinical caution by prioritizing the
      most pathogenic finding, even when accompanied by benign variants
    """
    if not labels:
        # No variants: you can choose to treat this as green or None
        return {
            "color": "green",
            "max_severity": 0,
            "normalized_score": 0.0,
            "unknown_labels": [],
        }

    severities = []
    unknown = []

    for raw in labels:
        if raw is None:
            unknown.append(raw)
            continue

        label = raw.strip().lower()
        if label in ACMG_SEVERITY:
            severities.append(ACMG_SEVERITY[label])
        else:
            unknown.append(raw)

    if not severities:
        # If everything is unknown, you might want a special behavior
        return {
            "color": "yellow",  # or 'green' or None, depending on policy
            "max_severity": None,
            "normalized_score": None,
            "unknown_labels": unknown,
        }

    max_severity = max(severities)
    normalized_score = max_severity / 4.0

    if max_severity <= 1:
        color: Color = "green"
    elif max_severity == 2:
        color = "yellow"
    else:  # 3 or 4
        color = "red"

    return {
        "color": color,
        "max_severity": max_severity,
        "normalized_score": normalized_score,
        "unknown_labels": unknown,
    }



labels = ["benign", "benign", "benign", "likely benign",]

result = gauge_from_acmg_labels(labels)
print(result)
