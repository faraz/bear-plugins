export default [
  {
    "eta": 0.75,
    "title": "SHRINKING OSCILLATIONS",
    "result": "Closer to zero. Lower loss.",
    "states": [
      {
        "eta": 0.75,
        "step": 0,
        "x": 1,
        "loss": 1,
        "sharpness": 2,
        "effective": 1.5,
        "multiplier": -0.5,
        "regime": "Shrinking"
      },
      {
        "eta": 0.75,
        "step": 1,
        "x": -0.5,
        "loss": 0.25,
        "sharpness": 2,
        "effective": 1.5,
        "multiplier": -0.5,
        "regime": "Shrinking"
      },
      {
        "eta": 0.75,
        "step": 2,
        "x": 0.25,
        "loss": 0.0625,
        "sharpness": 2,
        "effective": 1.5,
        "multiplier": -0.5,
        "regime": "Shrinking"
      },
      {
        "eta": 0.75,
        "step": 3,
        "x": -0.125,
        "loss": 0.015625,
        "sharpness": 2,
        "effective": 1.5,
        "multiplier": -0.5,
        "regime": "Shrinking"
      },
      {
        "eta": 0.75,
        "step": 4,
        "x": 0.0625,
        "loss": 0.00390625,
        "sharpness": 2,
        "effective": 1.5,
        "multiplier": -0.5,
        "regime": "Shrinking"
      }
    ]
  },
  {
    "eta": 1,
    "title": "THE NEUTRAL BOUNDARY",
    "result": "Same distance. Same loss.",
    "states": [
      {
        "eta": 1,
        "step": 0,
        "x": 1,
        "loss": 1,
        "sharpness": 2,
        "effective": 2,
        "multiplier": -1,
        "regime": "Neutral boundary"
      },
      {
        "eta": 1,
        "step": 1,
        "x": -1,
        "loss": 1,
        "sharpness": 2,
        "effective": 2,
        "multiplier": -1,
        "regime": "Neutral boundary"
      },
      {
        "eta": 1,
        "step": 2,
        "x": 1,
        "loss": 1,
        "sharpness": 2,
        "effective": 2,
        "multiplier": -1,
        "regime": "Neutral boundary"
      },
      {
        "eta": 1,
        "step": 3,
        "x": -1,
        "loss": 1,
        "sharpness": 2,
        "effective": 2,
        "multiplier": -1,
        "regime": "Neutral boundary"
      },
      {
        "eta": 1,
        "step": 4,
        "x": 1,
        "loss": 1,
        "sharpness": 2,
        "effective": 2,
        "multiplier": -1,
        "regime": "Neutral boundary"
      }
    ]
  },
  {
    "eta": 1.1,
    "title": "GROWING OSCILLATIONS",
    "result": "Farther from zero. Higher loss.",
    "states": [
      {
        "eta": 1.1,
        "step": 0,
        "x": 1,
        "loss": 1,
        "sharpness": 2,
        "effective": 2.2,
        "multiplier": -1.2000000000000002,
        "regime": "Growing"
      },
      {
        "eta": 1.1,
        "step": 1,
        "x": -1.2000000000000002,
        "loss": 1.4400000000000004,
        "sharpness": 2,
        "effective": 2.2,
        "multiplier": -1.2000000000000002,
        "regime": "Growing"
      },
      {
        "eta": 1.1,
        "step": 2,
        "x": 1.4400000000000004,
        "loss": 2.073600000000001,
        "sharpness": 2,
        "effective": 2.2,
        "multiplier": -1.2000000000000002,
        "regime": "Growing"
      },
      {
        "eta": 1.1,
        "step": 3,
        "x": -1.7280000000000006,
        "loss": 2.9859840000000024,
        "sharpness": 2,
        "effective": 2.2,
        "multiplier": -1.2000000000000002,
        "regime": "Growing"
      },
      {
        "eta": 1.1,
        "step": 4,
        "x": 2.073600000000001,
        "loss": 4.299816960000005,
        "sharpness": 2,
        "effective": 2.2,
        "multiplier": -1.2000000000000002,
        "regime": "Growing"
      }
    ]
  }
];
