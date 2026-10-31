export default [
  {
    "amplitude": 0.2,
    "plus": {
      "amplitude": 0.2,
      "phase": 0,
      "x": 0.2,
      "baseline": -0.1,
      "alternating": 0.4,
      "even": 0.020000000000000004,
      "averageY": -0.08,
      "updateY": 0.08800000000000001,
      "eta": 1.1,
      "label": "Positive sample",
      "direction": "Toward higher local curvature"
    },
    "minus": {
      "amplitude": 0.2,
      "phase": 1,
      "x": -0.2,
      "baseline": -0.1,
      "alternating": -0.4,
      "even": 0.020000000000000004,
      "averageY": -0.08,
      "updateY": 0.08800000000000001,
      "eta": 1.1,
      "label": "Negative sample",
      "direction": "Toward higher local curvature"
    },
    "mean": {
      "amplitude": 0.2,
      "phase": 2,
      "x": 0,
      "baseline": -0.1,
      "alternating": 0,
      "even": 0.020000000000000004,
      "averageY": -0.08,
      "updateY": 0.08800000000000001,
      "eta": 1.1,
      "label": "Paired average",
      "direction": "Toward higher local curvature"
    },
    "center": {
      "gradient": [
        0,
        -0.1
      ],
      "updateY": 0.11000000000000001
    },
    "meanLoss": 0.04000000000000001
  },
  {
    "amplitude": 0.6,
    "plus": {
      "amplitude": 0.6,
      "phase": 0,
      "x": 0.6,
      "baseline": -0.1,
      "alternating": 1.2,
      "even": 0.18,
      "averageY": 0.07999999999999999,
      "updateY": -0.088,
      "eta": 1.1,
      "label": "Positive sample",
      "direction": "Toward lower local curvature"
    },
    "minus": {
      "amplitude": 0.6,
      "phase": 1,
      "x": -0.6,
      "baseline": -0.1,
      "alternating": -1.2,
      "even": 0.18,
      "averageY": 0.07999999999999999,
      "updateY": -0.088,
      "eta": 1.1,
      "label": "Negative sample",
      "direction": "Toward lower local curvature"
    },
    "mean": {
      "amplitude": 0.6,
      "phase": 2,
      "x": 0,
      "baseline": -0.1,
      "alternating": 0,
      "even": 0.18,
      "averageY": 0.07999999999999999,
      "updateY": -0.088,
      "eta": 1.1,
      "label": "Paired average",
      "direction": "Toward lower local curvature"
    },
    "center": {
      "gradient": [
        0,
        -0.1
      ],
      "updateY": 0.11000000000000001
    },
    "meanLoss": 0.36
  }
];
