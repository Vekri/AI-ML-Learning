import type { Topic } from "../types";

export const round2: Topic[] = [
  {
    slug: "random-forest",
    title: "How does a Random Forest work?",
    round: "ml",
    priority: "very-high",
    minutes: 14,
    technologies: ["scikit-learn", "decision trees", "bagging", "feature importance"],
    interviewerWants:
      "Bagging, feature randomness, why variance drops, and a honest take on feature importance.",
    sayIn60:
      "A random forest is an ensemble of decision trees trained on bootstrap samples. At each split, a tree sees only a random subset of features. Each tree can overfit its sample. Averaging the votes, or averaging the probabilities, reduces variance because the trees' errors are not perfectly correlated. That correlation is why the feature subset matters: if every tree splits on the same strong feature first, averaging buys little. Importance from mean decrease in impurity is a useful hint and a biased one. I confirm with permutation importance on held-out data.",
    fiveMinute: [
      "One tree: axis-aligned splits, greedily reducing impurity.",
      "Bootstrap: sample rows with replacement, about a third left out (out-of-bag).",
      "Feature subset: sqrt of feature count is the usual classification default.",
      "Prediction: majority vote or mean probability.",
      "Strengths: nonlinear interactions, mixed feature types, little scaling required.",
      "Limits: weak extrapolation, large memory, impurity importance favors high-cardinality features.",
    ],
    sections: [
      {
        heading: "The tree underneath",
        paragraphs: [
          "A decision tree picks a feature and a threshold to make the child nodes purer than the parent. For classification, purity is often Gini: 1 minus the sum of squared class proportions. For regression, the split reduces variance of the target. The tree keeps splitting until a depth, a minimum leaf size, or a purity stop. An unrestricted tree memorizes the training rows. That is high variance.",
        ],
      },
      {
        heading: "Two kinds of randomness",
        paragraphs: [
          "Bagging trains each tree on a sample drawn with replacement. Rows left out of a tree are its out-of-bag rows, and their error is a free estimate of generalization, close to cross-validation when the forest is large. The second randomness restricts the candidate features at each split. Together they decorrelate the trees. The forest prediction is the average. Variance of an average falls as correlation between the members falls.",
          "You do not scale numeric features for a tree split, and monotone transforms of a single feature do not change the possible partitions of that feature. Interactions are captured when two features are used on the path from root to leaf. The forest does not invent a linear slope outside the training range: a regression tree predicts a leaf average, so it cannot extrapolate a trend.",
        ],
      },
      {
        heading: "Feature importance you can defend",
        paragraphs: [
          "Impurity importance adds up the impurity decrease at every split that used the feature, averaged over trees. It prefers features with many possible split points, so a customer id can look important. Permutation importance shuffles one column on data the tree did not train on and measures how much the score drops. That is the number I take to a stakeholder. Correlated features share credit. If price and discount move together, each can look weak while the pair is strong. Say that before someone deletes a column.",
        ],
      },
    ],
    demo: "forest",
    examples: [
      {
        id: "stump-forest",
        title: "A forest of randomized stumps",
        language: "python",
        summary:
          "Runs in the browser. Production trees are deeper. This model keeps the two ideas you must say: bootstrap samples, and a random feature subset at the split. Labels are high demand (1) or not (0) from promo, weekend, temperature, and last week's units.",
        code: `import random
from collections import Counter

rows = [
    (1, 1, 28, 50, 1),
    (1, 0, 30, 42, 1),
    (0, 1, 22, 38, 1),
    (0, 0, 35, 10, 0),
    (0, 0, 18, 12, 0),
    (1, 0, 33, 15, 0),
    (0, 1, 26, 45, 1),
    (1, 1, 31, 20, 1),
    (0, 0, 29, 8, 0),
    (1, 0, 21, 36, 1),
    (0, 1, 34, 11, 0),
    (1, 1, 19, 48, 1),
]

def gini(labels):
    if not labels:
        return 0.0
    p = sum(labels) / len(labels)
    return 1 - p * p - (1 - p) ** 2

def best_stump(sample, features):
    best = None
    for feature in features:
        for threshold in sorted({row[feature] for row in sample}):
            left = [row[-1] for row in sample if row[feature] <= threshold]
            right = [row[-1] for row in sample if row[feature] > threshold]
            if not left or not right:
                continue
            score = (len(left) * gini(left) + len(right) * gini(right)) / len(sample)
            if best is None or score < best[0]:
                best = (score, feature, threshold, left, right)
    return best

def majority(labels):
    ones = sum(labels)
    return 1 if ones >= (len(labels) - ones) else 0

def train_forest(data, n_trees=40, seed=7):
    rng = random.Random(seed)
    trees = []
    for _ in range(n_trees):
        sample = [data[rng.randrange(len(data))] for _ in data]
        features = rng.sample(range(4), 2)
        picked = best_stump(sample, features)
        _, feature, threshold, left, right = picked
        trees.append((feature, threshold, majority(left), majority(right)))
    return trees

def predict_row(forest, row):
    votes = []
    for feature, threshold, left_label, right_label in forest:
        votes.append(left_label if row[feature] <= threshold else right_label)
    return 1 if sum(votes) * 2 >= len(votes) else 0, votes

forest = train_forest(rows)
correct = sum(predict_row(forest, row)[0] == row[-1] for row in rows)
names = ["promo", "weekend", "temp", "last_week"]
print("trees", len(forest))
print("resubstitution accuracy", round(correct / len(rows), 2))
print("feature picks", dict(Counter(names[tree[0]] for tree in forest)))
label, votes = predict_row(forest, (1, 1, 24, 40, None))
print("example label", label, "yes-votes", sum(votes), "of", len(votes))
`,
      },
      {
        id: "sklearn-forest",
        title: "scikit-learn forest and permutation importance",
        language: "python",
        packages: ["scikit-learn"],
        summary:
          "Runs in the browser after scikit-learn loads. A small forest so the page finishes; in production you raise n_estimators and min_samples_leaf, and you still permute on holdout data only.",
        code: `from sklearn.ensemble import RandomForestClassifier
from sklearn.inspection import permutation_importance
from sklearn.model_selection import train_test_split

rows = []
for i in range(80):
    promo = i % 2
    weekend = 1 if i % 5 == 0 else 0
    temp = 10 + (i % 15)
    last = 8 + (i % 20)
    stockout = 1 if (promo and last > 18) or (weekend and temp > 20) else 0
    rows.append((promo, weekend, temp, last, stockout))

X = [list(row[:4]) for row in rows]
y = [row[4] for row in rows]
X_train, X_valid, y_train, y_valid = train_test_split(
    X, y, test_size=0.3, random_state=7, stratify=y
)
model = RandomForestClassifier(
    n_estimators=40,
    max_depth=4,
    min_samples_leaf=2,
    max_features="sqrt",
    oob_score=True,
    random_state=7,
    n_jobs=1,
)
model.fit(X_train, y_train)
print("oob", round(float(model.oob_score_), 3))
print("valid accuracy", round(float(model.score(X_valid, y_valid)), 3))
result = permutation_importance(
    model, X_valid, y_valid, n_repeats=6, random_state=7, n_jobs=1
)
names = ["promo", "weekend", "temp_c", "units_last_week"]
order = sorted(range(4), key=lambda i: result.importances_mean[i], reverse=True)
for i in order:
    print(names[i], round(float(result.importances_mean[i]), 3))
`,
      },
    ],
    followUps: [
      {
        q: "Why not one deep tree?",
        a: "A deep tree has low bias and high variance. The forest keeps the low bias of deep-enough trees and cuts variance by averaging decorrelated errors. You still cap depth or leaf size so individual trees are not pure noise.",
      },
      {
        q: "Random forest or gradient boosting?",
        a: "A forest is harder to overfit and easier to tune. Boosting often wins on structured tabular data when you have time to tune learning rate and tree size, and when the signal is in hard residuals. I start with a regularized linear model and a forest as baselines, then try boosting if the metric is still short of the business bar.",
      },
    ],
    pitfalls: [
      "Quoting impurity importance as causal.",
      "Reporting accuracy on the same rows the trees memorized. Use out-of-bag or a real holdout.",
      "Forgetting that correlated features split credit.",
    ],
  },
  {
    slug: "overfitting",
    title: "What is overfitting?",
    round: "ml",
    priority: "very-high",
    minutes: 12,
    technologies: ["cross-validation", "regularization", "learning curves", "early stopping"],
    interviewerWants:
      "A definition tied to generalization, plus the specific control you would turn for the model in front of you.",
    sayIn60:
      "Overfitting is when the model fits sample noise, so training error keeps falling while error on new data rises. The model has memorized this draw of the data. I look for a gap between training and validation metrics, and I confirm with a learning curve or a second holdout I did not tune on. The fix depends on the model: shallower trees or larger leaves, stronger L1 or L2, dropout, early stopping, more data, or fewer features. Cross-validation tells me the gap is real. It does not by itself remove it.",
    fiveMinute: [
      "Define generalization: performance on data the fitting procedure did not see.",
      "Bias is systematic miss; variance is sensitivity to the sample.",
      "Show train versus test error across model capacity.",
      "Name the regularizer for linear models, trees, and boosting.",
      "A final test set is touched once. Validation is what you tune on.",
      "Data leakage looks like amazing validation and a failed launch.",
    ],
    sections: [
      {
        heading: "The gap is the symptom",
        paragraphs: [
          "A model underfits when both training and validation error are high and close. It cannot represent the signal. It overfits when training error is low and validation error is worse and, as you add capacity, gets worse still. The runnable example fits polynomials to a noisy sine. Degree 1 underfits. Degree 3 tracks the curve. Degree 12 interpolates the noise: training error collapses and test error jumps. L2 on the degree-12 model pulls the wild coefficients back and the test error recovers.",
          "Cross-validation averages that gap across folds so one lucky split cannot fool you. It does not replace a time-based split. In retail, a random split puts Tuesday and Wednesday of the same promo into train and test. The honest split is by time, and sometimes by store group, when the decision is about future weeks or new stores.",
        ],
      },
      {
        heading: "What you regularize",
        paragraphs: [
          "Linear models: L2 shrinks coefficients, L1 can zero them. Trees: max depth, min samples per leaf, and the feature subset. Gradient boosting: learning rate, number of trees via early stopping on a validation set, and subsample. Neural nets: weight decay, dropout, and early stopping. More relevant data beats a cleverer penalty when the model is already regularized and still short.",
          "Leakage is the overfitting you do not see in the metric. A feature built with the full-sample mean, a target encoded using the validation rows, or a future price sitting on today's row will make validation look solved. The fix is to fit every transformer inside the training fold only.",
        ],
      },
    ],
    examples: [
      {
        id: "poly-gap",
        title: "Train error falls, test error rises",
        language: "python",
        summary:
          "Runs in the browser. Noisy sine wave, polynomial degrees 1, 3, and 12, then degree 12 with L2. Watch the test column.",
        code: `import math
import random

rng = random.Random(0)

def fit(xs, ys, degree, l2=0.0):
    p = degree + 1
    ata = [[0.0] * p for _ in range(p)]
    aty = [0.0] * p
    for x, y in zip(xs, ys):
        row = [x ** d for d in range(p)]
        for i in range(p):
            aty[i] += row[i] * y
            for j in range(p):
                ata[i][j] += row[i] * row[j]
    for i in range(1, p):
        ata[i][i] += l2
    aug = [ata[i][:] + [aty[i]] for i in range(p)]
    for col in range(p):
        pivot = max(range(col, p), key=lambda r: abs(aug[r][col]))
        aug[col], aug[pivot] = aug[pivot], aug[col]
        div = aug[col][col] or 1e-12
        for j in range(col, p + 1):
            aug[col][j] /= div
        for r in range(p):
            if r == col:
                continue
            factor = aug[r][col]
            for j in range(col, p + 1):
                aug[r][j] -= factor * aug[col][j]
    return [aug[i][p] for i in range(p)]

def mse(beta, xs, ys):
    err = 0.0
    for x, y in zip(xs, ys):
        pred = sum(b * (x ** i) for i, b in enumerate(beta))
        err += (pred - y) ** 2
    return err / len(xs)

xs = [i / 20 for i in range(21)]
ys = [math.sin(2 * math.pi * x) + rng.uniform(-0.15, 0.15) for x in xs]
train = [(x, y) for i, (x, y) in enumerate(zip(xs, ys)) if i % 2 == 0]
test = [(x, y) for i, (x, y) in enumerate(zip(xs, ys)) if i % 2 == 1]
print(f"{'model':16} {'train':8} {'test':8}")
for degree in (1, 3, 12):
    beta = fit([x for x, _ in train], [y for _, y in train], degree)
    tr = mse(beta, [x for x, _ in train], [y for _, y in train])
    te = mse(beta, [x for x, _ in test], [y for _, y in test])
    print(f"{'degree ' + str(degree):16} {tr:8.3f} {te:8.3f}")
beta = fit([x for x, _ in train], [y for _, y in train], 12, l2=1.0)
tr = mse(beta, [x for x, _ in train], [y for _, y in train])
te = mse(beta, [x for x, _ in test], [y for _, y in test])
print(f"{'degree 12 + L2':16} {tr:8.3f} {te:8.3f}")
`,
      },
    ],
    followUps: [
      {
        q: "Is a perfect training score always bad?",
        a: "On noisy labels, yes, it is a warning. On a separable toy, it can be fine if validation matches. I never ship on training score alone.",
      },
      {
        q: "What is early stopping?",
        a: "Watch validation error as you add boosting rounds or epochs. Stop when it stops improving, and keep the parameters from that point. The validation set used to stop is no longer a clean final exam, so the reported number should come from another split or from cross-validation of the whole procedure.",
      },
    ],
    pitfalls: [
      "Tuning on the test set until the test set is a second training set.",
      "A random split on time series.",
      "Calling every gap overfitting when the validation slice is a different population, such as a new region.",
    ],
  },
  {
    slug: "classification-metrics",
    title: "How do you evaluate a classifier?",
    round: "ml",
    priority: "high",
    minutes: 14,
    technologies: ["precision", "recall", "F1", "ROC-AUC", "PR-AUC"],
    interviewerWants:
      "A metric tied to the cost of false positives and false negatives, and the reason accuracy fails when classes are uneven.",
    sayIn60:
      "I start from the confusion matrix and the business cost. Precision is the share of predicted positives that are real. Recall is the share of real positives I caught. F1 summarizes them when I need one number and both errors matter. ROC-AUC measures ranking across thresholds. PR-AUC is the one I trust more when positives are rare, because ROC can look strong while most alerts are false. Accuracy hides that. I pick the threshold from cost, not from 0.5.",
    fiveMinute: [
      "Write TP, FP, FN, TN and define precision and recall from them.",
      "Give a retail example: missed stockout versus wasted promo.",
      "F1 is the harmonic mean, so a zero on either side hurts.",
      "ROC-AUC is threshold-free ranking. PR-AUC focuses on the positive class.",
      "Calibrated probabilities matter if the score drives a quantity, not just a rank.",
      "Report the metric on a time-based holdout, with a baseline.",
    ],
    sections: [
      {
        heading: "Names that match a decision",
        paragraphs: [
          "Precision = TP / (TP + FP). Of the stores I flagged for a rush order, how many truly needed it. Recall = TP / (TP + FN). Of the stores that stocked out, how many did I flag. A high-precision, low-recall model stays quiet and misses events. A high-recall, low-precision model pages people all day. F1 = 2PR / (P + R) is useful for model selection. It is not a substitute for the cost ratio. If a missed stockout costs five times a false alarm, I slide the threshold and optimize expected cost.",
        ],
      },
      {
        heading: "Curves versus a single cut",
        paragraphs: [
          "ROC plots true positive rate against false positive rate as the threshold moves. AUC is the probability a random positive ranks above a random negative. When positives are 1% of rows, a model can score a high ROC-AUC and still produce an alert list that is mostly wrong. The precision-recall curve stays honest there because precision punishes those false alarms. I report both, and I lead with PR-AUC or cost when the class is rare.",
          "The lab below is the confusion matrix with the formulas live. Change the counts and watch precision fall as false positives climb. That is the conversation with an operator: every extra FP is a truck or a page.",
        ],
      },
    ],
    demo: "metrics",
    examples: [
      {
        id: "metrics-from-scores",
        title: "Precision, recall, F1, and a ROC-AUC sketch",
        language: "python",
        summary:
          "Runs in the browser. Eight scored rows, a 0.5 cut, then a sweep that builds a ROC curve with the trapezoid rule.",
        code: `pairs = [
    (1, 0.92),
    (1, 0.80),
    (1, 0.63),
    (1, 0.41),
    (0, 0.70),
    (0, 0.33),
    (0, 0.22),
    (0, 0.08),
]

def confusion(cut):
    tp = fp = fn = tn = 0
    for label, score in pairs:
        pred = score >= cut
        if pred and label == 1:
            tp += 1
        elif pred and label == 0:
            fp += 1
        elif (not pred) and label == 1:
            fn += 1
        else:
            tn += 1
    return tp, fp, fn, tn

def safe_div(n, d):
    return n / d if d else 0.0

tp, fp, fn, tn = confusion(0.5)
precision = safe_div(tp, tp + fp)
recall = safe_div(tp, tp + fn)
f1 = safe_div(2 * precision * recall, precision + recall)
print(f"cut 0.5  TP {tp} FP {fp} FN {fn} TN {tn}")
print(f"precision {precision:.2f}  recall {recall:.2f}  f1 {f1:.2f}")
print(f"accuracy {safe_div(tp + tn, len(pairs)):.2f}")

roc = []
for cut in sorted({score for _, score in pairs}, reverse=True):
    tp, fp, fn, tn = confusion(cut)
    roc.append((safe_div(fp, fp + tn), safe_div(tp, tp + fn)))
roc = [(0.0, 0.0)] + roc + [(1.0, 1.0)]
auc = 0.0
for (x0, y0), (x1, y1) in zip(roc, roc[1:]):
    auc += (x1 - x0) * (y0 + y1) / 2
print(f"roc-auc {auc:.2f}")
`,
      },
    ],
    followUps: [
      {
        q: "Why harmonic mean for F1?",
        a: "The harmonic mean stays near the smaller of precision and recall. An arithmetic mean would let a model with precision 1 and recall 0.01 look half-decent.",
      },
      {
        q: "Do you optimize AUC directly?",
        a: "AUC is for comparing rankers. The deployed system needs a threshold, and that threshold should minimize cost or hit an operations constraint such as 'at most 30 alerts a morning'.",
      },
    ],
    pitfalls: [
      "Accuracy on a 98% negative set.",
      "A single 0.5 threshold copied from a tutorial.",
      "Computing AUC on data that leaked the label through a feature.",
    ],
  },
  {
    slug: "regression-and-classification",
    title: "Classification and regression",
    round: "ml",
    priority: "core",
    minutes: 10,
    technologies: ["logistic regression", "linear regression", "loss", "baseline"],
    interviewerWants:
      "You can name the target type, the loss, a baseline, and why a fancier model has to beat it.",
    sayIn60:
      "Classification predicts a category. Regression predicts a number. I still start both with a baseline: majority class or last week’s sales. Linear and logistic regression are the interpretable first models, with coefficients I can explain and regularization I can defend. I move to trees or boosting when interactions and thresholds show up in the residuals. The metric follows the target: log loss or PR-AUC for a rare event, MAE or a pinball loss for demand, never accuracy for a unit forecast.",
    fiveMinute: [
      "Target first. If someone says 'predict demand' ask for the grain and whether they need a class or a quantity.",
      "Baseline: seasonal naive for retail demand is often hard to beat.",
      "Linear model assumptions you actually check: leakage, scaling for regularized linear models, and residual shape.",
      "Logistic regression outputs a probability via a sigmoid. Calibrate if you threshold on cost.",
      "Classification of demand ('high' / 'low') throws away information if the truck needs a quantity.",
    ],
    sections: [
      {
        heading: "Do not discretize a quantity by accident",
        paragraphs: [
          "A buyer who asks for 'high demand SKUs' often needs a forecast and a cutoff you chose together. Turning units into a label before modeling makes the loss ignore the difference between 2 extra cases and 200. If the action is a binary page, a classifier can be right. If the action is an order quantity, regress and then apply the policy.",
        ],
      },
      {
        heading: "Losses worth naming",
        paragraphs: [
          "Squared error punishes large misses and is sensitive to a stockout spike. Absolute error matches 'typical case error' better. For quantiles, pinball loss trains a model that aims at the 90th percentile when under-forecasting is expensive. Log loss trains probabilities. I say which loss matches the decision before I say which algorithm I like.",
        ],
      },
    ],
    examples: [
      {
        id: "baseline",
        title: "A forecast has to beat last week",
        language: "python",
        summary:
          "Runs in the browser. Mean absolute error for a naive lag versus a shrink toward the mean.",
        code: `weeks = [30, 28, 35, 33, 60, 32, 31, 34]
# Predict week t with week t-1 (seasonal naive stand-in).
naive_errors = [abs(weeks[i] - weeks[i - 1]) for i in range(1, len(weeks))]
# Shrink the lag halfway toward the training mean of prior weeks.
shrink_errors = []
for i in range(1, len(weeks)):
    hist = weeks[:i]
    mean = sum(hist) / len(hist)
    pred = 0.5 * weeks[i - 1] + 0.5 * mean
    shrink_errors.append(abs(weeks[i] - pred))

def mae(errors):
    return sum(errors) / len(errors)

print("naive MAE", round(mae(naive_errors), 2))
print("shrink MAE", round(mae(shrink_errors), 2))
print("The spike at 60 dominates squared error more than absolute error.")
print("squared naive", round(sum(e * e for e in naive_errors) / len(naive_errors), 1))
`,
      },
    ],
    followUps: [
      {
        q: "When is logistic regression enough?",
        a: "When the signal is roughly linear in your features, you need coefficients for a review, and the data is wide or sparse. Text and one-hot retail calendars often fall in this bucket. I add interactions explicitly if I know about them, such as promo times weekend.",
      },
      {
        q: "What baseline do you refuse to skip?",
        a: "For demand, last comparable period. For a classifier, the positive rate. A model that cannot beat those does not ship, however modern the algorithm name is.",
      },
    ],
    pitfalls: [
      "RMSE as the only retail metric when buyers think in cases of typical error.",
      "No baseline in the slide.",
      "Classifying a continuous decision because the tutorial was about classifiers.",
    ],
  },
  {
    slug: "feature-engineering",
    title: "Feature engineering",
    round: "ml",
    priority: "core",
    minutes: 10,
    technologies: ["lags", "rolling windows", "target leakage", "encodings"],
    interviewerWants:
      "Features that respect time, a leakage example, and the discipline of fitting encoders on train only.",
    sayIn60:
      "I design features from the decision time. For a Monday order, only information known on Monday morning is legal: lags of sales, trailing means that end yesterday, promo flags already scheduled, and store attributes. I do not use this week's total. Encoders, imputers, and target means are fit on the training fold and saved with the model. A feature that looks brilliant and uses the label, or uses the future, is leakage, and I would rather have a dull honest model.",
    fiveMinute: [
      "Write the decision timestamp on the whiteboard.",
      "Lags and rolling windows per store and SKU, with a defined gap.",
      "Calendar: week of year, payday, holiday, with a cycle encoding if the model is linear.",
      "Categorical: one-hot for small sets, target encoding with out-of-fold means for large sets.",
      "Nulls: a missing delivery is information. Add a missing indicator before you fill.",
    ],
    sections: [
      {
        heading: "Retail features that usually matter",
        paragraphs: [
          "Recent velocity (units over 7 and 28 days), the same window a year ago if you have it, price and promo depth, on-hand inventory, and whether the store was stocked out. A stockout day is not a zero-demand day. If you train on censored zeros you teach the model that customers did not want the item. A simple fix is a flag plus, where you can, an estimate from similar stores.",
          "Interactions you already believe: promo on a weekend, weather for seasonal categories, a new store with thin history. Putting the interaction in the feature set helps a linear model. A tree can search for it, but an explicit feature is easier to monitor.",
        ],
      },
      {
        heading: "Fit transforms inside the fold",
        paragraphs: [
          "A mean imputer computed on all rows leaks a little of the future into the past. Target encoding computed with the row's own label leaks a lot. The safe pattern is a pipeline: split, fit the transformer on train, transform validation, and persist the transformer with the model version. At serve time you recompute features with the same code path. A second implementation in the API is how training-serving skew is born.",
        ],
      },
    ],
    examples: [
      {
        id: "legal-lag",
        title: "A lag that does not see today",
        language: "python",
        summary:
          "Runs in the browser. The feature for day t uses days before t only. The illegal column peeks at t and will look smarter than it is.",
        code: `units = [10, 12, 9, 40, 11, 13, 12]
print(f"{'day':4} {'legal_lag':10} {'illegal_includes_today':22}")
for t in range(len(units)):
    history = units[max(0, t - 3):t]
    legal = sum(history) / len(history) if history else None
    peeked = units[max(0, t - 2):t + 1]
    illegal = sum(peeked) / len(peeked)
    legal_text = "n/a" if legal is None else f"{legal:.1f}"
    print(f"{t:4} {legal_text:10} {illegal:22.1f}")
print("Day 3's illegal mean is pulled up by the 40 you are trying to predict.")
`,
      },
    ],
    followUps: [
      {
        q: "How do you handle a new SKU?",
        a: "It has no lag. Use a prior from category and store format, widen the prediction interval, and do not pretend the point forecast is as sharp as a mature SKU. A hierarchical model or a fallback to category velocity is an honest design.",
      },
      {
        q: "One-hot or target encoding?",
        a: "One-hot when the cardinality is small and I want the coefficient. Target encoding when there are thousands of stores or SKUs, computed out of fold, with smoothing toward the global mean so a store with five rows does not get a wild rate.",
      },
    ],
    pitfalls: [
      "Scaling with the full dataset before the split.",
      "Using 'units this week' to predict 'units this week'.",
      "Filling stockout zeros and calling them demand.",
    ],
  },
  {
    slug: "imbalanced-data",
    title: "Imbalanced data",
    round: "ml",
    priority: "core",
    minutes: 10,
    technologies: ["class weights", "PR-AUC", "threshold", "sampling"],
    interviewerWants:
      "You do not reach for SMOTE first. You fix the metric, the threshold, and maybe the loss weight.",
    sayIn60:
      "Imbalance means the positive event is rare, so accuracy flatters a model that always says no. I keep the natural prevalence if the score is a probability I will threshold later. I judge the model with PR-AUC or cost, and I set class weight or a decision threshold so recall meets the operation. Resampling changes the prevalence the model sees, so the raw score is no longer a probability of the real world unless I calibrate it back. I use resampling when the minority class is so small the tree never splits on it, not as a default.",
    fiveMinute: [
      "State the base rate out loud.",
      "Accuracy and even ROC-AUC can flatter you. Look at precision at the recall you need.",
      "class_weight='balanced' is the first lever in scikit-learn.",
      "Threshold tuning on a validation set is often enough.",
      "If you oversample, calibrate before you treat scores as probabilities.",
      "Collecting more positives beats synthetic positives when you can do it.",
    ],
    sections: [
      {
        heading: "What is actually broken",
        paragraphs: [
          "The algorithm is not confused because 2% is a small number. A logistic model can estimate a 2% event. The confusion is human: a 98% accuracy report, a 0.5 threshold that never fires, and a tree that says the majority class in every leaf because the impurity gain from a tiny class is small. Those are three different fixes. Change the reported metric. Lower the threshold or raise the positive weight. Lower the leaf size or the impurity hurdle so the rare class can own a leaf.",
        ],
      },
      {
        heading: "Sampling, said carefully",
        paragraphs: [
          "Downsampling the majority class speeds training and rebalances the gradient. It throws away data, so I only do it when the majority class is huge and I keep a validation set at the real prevalence. Upsampling duplicates minorities and can overfit those copies. SMOTE invents points between neighbors. It can help a small tabular set and it can also invent impossible rows, such as a fractional store format. I mention it as an option I justify, not as the answer.",
        ],
      },
    ],
    examples: [
      {
        id: "accuracy-trap",
        title: "Always-negative looks accurate",
        language: "python",
        summary:
          "Runs in the browser. Forty negatives and two positives. Accuracy praises the useless model. Recall does not.",
        code: `labels = [0] * 40 + [1, 1]

def scores_for(kind):
    if kind == "always_no":
        return [0.0] * len(labels)
    # A weak but real ranker: positives scored higher.
    return [0.05] * 40 + [0.40, 0.55]

def metrics(scores, cut):
    tp = fp = fn = tn = 0
    for label, score in zip(labels, scores):
        pred = int(score >= cut)
        tp += pred == 1 and label == 1
        fp += pred == 1 and label == 0
        fn += pred == 0 and label == 1
        tn += pred == 0 and label == 0
    accuracy = (tp + tn) / len(labels)
    recall = tp / (tp + fn) if (tp + fn) else 0
    precision = tp / (tp + fp) if (tp + fp) else 0
    return accuracy, precision, recall

print(f"{'model':12} {'acc':6} {'prec':6} {'recall':6}")
for name, cut in (("always_no", 0.5), ("ranker", 0.5), ("ranker", 0.3)):
    acc, prec, rec = metrics(scores_for("always_no" if name == "always_no" else "ranker"), cut)
    print(f"{name + '@' + str(cut):12} {acc:6.2f} {prec:6.2f} {rec:6.2f}")
`,
      },
    ],
    followUps: [
      {
        q: "Should the training prevalence match production?",
        a: "If you need calibrated probabilities, yes, or you calibrate after. If you only need ranking and will tune a threshold, a reweighted loss is fine. Say which of the two you are shipping.",
      },
      {
        q: "What about a fraud or defect rate that shifts?",
        a: "The threshold does not travel. Monitor precision at the current recall, and re-tune when the base rate moves. A model can keep its ranking and still flood the queue after a shift.",
      },
    ],
    pitfalls: [
      "SMOTE on the full dataset before the split, which leaks synthetic neighbors across folds.",
      "Reporting accuracy.",
      "A 0.5 cutoff on a 1% event.",
    ],
  },
  {
    slug: "xgboost",
    title: "XGBoost and gradient boosting",
    round: "ml",
    priority: "core",
    minutes: 12,
    technologies: ["XGBoost", "gradient boosting", "early stopping", "learning rate"],
    interviewerWants:
      "Boosting versus bagging, the role of the learning rate, and the controls that stop it memorizing.",
    sayIn60:
      "Gradient boosting builds trees one after another. Each tree fits the residual of the current ensemble, and it is added with a small learning rate. That is different from a random forest, which builds deep trees in parallel on bootstrap samples and averages them. Boosting reduces bias stage by stage and will overfit if you add trees without a validation watch. I tune learning rate, tree depth, row and column subsampling, and I early-stop on a time-based validation set. On tabular retail data it is often the strongest classical model I try, after a baseline and a regularized linear model.",
    fiveMinute: [
      "Residual fitting: the next tree sees errors, not the original label alone.",
      "Learning rate (eta) shrinks each tree. Lower eta needs more trees and usually generalizes better.",
      "max_depth and min_child_weight limit how specific a leaf can get.",
      "subsample and colsample_bytree add the randomness boosting otherwise lacks.",
      "early_stopping_rounds on a validation set you trust.",
      "Missing values: XGBoost learns a default direction. Know that this exists and still impute when 'missing' has a business meaning you want as a feature.",
    ],
    sections: [
      {
        heading: "Why residuals, said simply",
        paragraphs: [
          "Start with a constant prediction, often the mean or the log-odds. Compute the gradient of the loss at each row. Fit a shallow tree to those gradients. Add the tree's prediction, scaled by the learning rate, to the ensemble. Repeat. Each tree is a correction. Because the corrections accumulate, a run of deep trees with a learning rate near 1 memorizes the training set. A learning rate of 0.05 with a few hundred shallow trees is the usual shape.",
          "A forest averages independent high-variance models. Boosting adds dependent low-variance models. The forest parallelizes easily. Boosting is sequential, though each tree's split search is parallel. I say this when someone asks why the forest trained faster and the booster scored better.",
        ],
      },
      {
        heading: "A practical tuning order",
        paragraphs: [
          "Fix the validation split first, by time. Set a modest depth, 3 to 6 for tabular data. Lower the learning rate until more trees still help and early stopping lands well before your cap. Then try subsample and column subsample around 0.8 if the model is unstable. Regularization on leaf weights (lambda, alpha) is the next turn. I do not grid-search twenty parameters on a test set. A small ordered search on validation, then one test read, is the story I want to tell.",
        ],
      },
    ],
    examples: [
      {
        id: "residual-boosting",
        title: "Three shallow corrections",
        language: "python",
        summary:
          "Runs in the browser. A toy booster fits a two-leaf tree to the residual, adds it at a learning rate, and shows training error dropping as the bias of a flat prediction is corrected.",
        code: `points = [
    (0, 1.0),
    (1, 1.2),
    (2, 1.1),
    (3, 3.0),
    (4, 3.4),
    (5, 3.1),
]

def stump_fit(rows):
    # rows are (x, residual). Try every midpoint split. Predict the mean residual on each side.
    xs = sorted({x for x, _ in rows})
    best = None
    for i in range(len(xs) - 1):
        cut = (xs[i] + xs[i + 1]) / 2
        left = [r for x, r in rows if x <= cut]
        right = [r for x, r in rows if x > cut]
        if not left or not right:
            continue
        pred_l = sum(left) / len(left)
        pred_r = sum(right) / len(right)
        err = sum((r - pred_l) ** 2 for x, r in rows if x <= cut)
        err += sum((r - pred_r) ** 2 for x, r in rows if x > cut)
        if best is None or err < best[0]:
            best = (err, cut, pred_l, pred_r)
    return best

rate = 0.6
pred = [0.0] * len(points)
print("start MAE", round(sum(abs(y - p) for (_, y), p in zip(points, pred)) / len(points), 3))
for stage in range(1, 4):
    residual = [(x, y - p) for (x, y), p in zip(points, pred)]
    _, cut, pred_l, pred_r = stump_fit(residual)
    pred = [
        p + rate * (pred_l if x <= cut else pred_r)
        for (x, _), p in zip(points, pred)
    ]
    mae = sum(abs(y - p) for (_, y), p in zip(points, pred)) / len(points)
    print(f"stage {stage} cut {cut:.1f} MAE {mae:.3f}")
`,
      },
      {
        id: "xgb-call",
        title: "Boosting controls, running in the browser",
        language: "python",
        packages: ["scikit-learn"],
        summary:
          "Runs in the browser with sklearn's gradient booster, which exposes the same controls you name for XGBoost: tree count, learning rate, depth, and subsample. XGBoost itself is the production library; early stopping still watches validation, never the test set.",
        code: `from sklearn.ensemble import GradientBoostingRegressor

# last_week, promo -> next-week units
X = [
    [40, 1], [12, 0], [30, 1], [8, 0], [22, 1],
    [15, 0], [35, 1], [18, 0], [28, 1], [11, 0],
    [33, 1], [9, 0], [26, 0], [21, 1], [14, 0],
]
y = [52, 11, 44, 9, 36, 14, 48, 16, 40, 12, 46, 10, 24, 34, 13]
model = GradientBoostingRegressor(
    n_estimators=60,
    learning_rate=0.08,
    max_depth=2,
    subsample=0.9,
    random_state=7,
)
model.fit(X, y)
pred = model.predict(X)
mae = sum(abs(a - b) for a, b in zip(pred, y)) / len(y)
print("train mae", round(float(mae), 2))
print("trees", model.n_estimators, "learning_rate", model.learning_rate)
print("predict last=30 promo=1", round(float(model.predict([[30, 1]])[0]), 1))
print("XGBoost production call uses n_estimators, learning_rate, max_depth,")
print("subsample, colsample_bytree, reg_lambda, and early_stopping_rounds.")
`,
      },
    ],
    followUps: [
      {
        q: "XGBoost, LightGBM, or CatBoost?",
        a: "All three are gradient boosters. LightGBM is fast on large data with its leaf-wise growth. CatBoost handles categorical columns with ordered target statistics and is a strong default when categories dominate. XGBoost is the one to be fluent in for interviews. I pick by validation score, training time, and whether categoricals are first-class. I do not claim one wins everywhere.",
      },
      {
        q: "How do you explain a booster to a buyer?",
        a: "I do not walk them through residuals. I show the baseline error, the model error, and the five features whose permutation hurts most, in cases of product. The residual story is for the technical round.",
      },
    ],
    pitfalls: [
      "early_stopping on the test set.",
      "A learning rate of 0.3 and 50 deep trees because it finished first.",
      "Treating gain importance as a causal promo readout.",
    ],
  },
  {
    slug: "feature-selection",
    title: "Feature selection",
    round: "ml",
    priority: "core",
    minutes: 9,
    technologies: ["correlation", "permutation importance", "regularization", "leakage checks"],
    interviewerWants:
      "A reason to drop a feature that is about stability, leakage, or cost, not a cookbook of filters.",
    sayIn60:
      "I do not start by deleting columns to make the model look tidy. I remove features that leak the target, features I cannot compute at serve time, and features that are constant or duplicated. For the rest I use the model: L1 if I want a sparse linear explanation, permutation importance if I want to know what the fitted model used on holdout data. Correlated pairs need a human decision because importance will split them. A feature that helps validation by 0.001 and costs a fragile upstream join is a feature I drop.",
    fiveMinute: [
      "Kill illegal features first: leakage and unavailable-at-serve.",
      "Filter zero-variance and exact duplicates. That is hygiene.",
      "Correlation is a screen for redundancy, not a ranking of usefulness. Two weak features can interact.",
      "Permutation importance on the validation set is the workhorse.",
      "Recursive elimination is expensive. Use it when the feature set is small and the story must be sparse.",
      "Re-check the metric after removal. Importance is not a prediction of the drop.",
    ],
    sections: [
      {
        heading: "Filters, wrappers, and embedded methods",
        paragraphs: [
          "A filter scores features without the final model, for example correlation with the target. It is cheap and blind to interactions. A wrapper searches subsets by refitting, which is honest and slow. An embedded method selects while fitting: L1 penalties and tree split gain. I use a filter to remove junk, then permutation importance from the real model to make the cut I defend.",
          "Stability matters more than one leaderboard. If the selected set changes completely when you move the time split by a month, you do not have a selection. You have noise. I would rather ship a slightly larger set that survives three time cuts.",
        ],
      },
    ],
    examples: [
      {
        id: "redundancy",
        title: "Correlation finds a duplicate, not the target",
        language: "python",
        summary:
          "Runs in the browser. price and price_copy correlate at 1. A model does not need both. Correlation with the label is a separate question.",
        code: `import math

rows = [
    # price, price_copy, promo, units
    (2.0, 2.0, 0, 10),
    (2.2, 2.2, 0, 11),
    (1.8, 1.8, 1, 18),
    (2.5, 2.5, 0, 9),
    (1.5, 1.5, 1, 20),
    (2.1, 2.1, 1, 16),
]

def corr(a, b):
    n = len(a)
    ma = sum(a) / n
    mb = sum(b) / n
    num = sum((x - ma) * (y - mb) for x, y in zip(a, b))
    da = math.sqrt(sum((x - ma) ** 2 for x in a))
    db = math.sqrt(sum((y - mb) ** 2 for y in b))
    return num / (da * db)

price = [r[0] for r in rows]
copy = [r[1] for r in rows]
promo = [r[2] for r in rows]
units = [r[3] for r in rows]
print("price vs copy", round(corr(price, copy), 3))
print("price vs units", round(corr(price, units), 3))
print("promo vs units", round(corr(promo, units), 3))
print("Drop price_copy. Re-check any model before dropping price itself.")
`,
      },
    ],
    followUps: [
      {
        q: "Can a feature with low correlation still matter?",
        a: "Yes. A split that only helps when promo is on will correlate weakly on its own. Trees and explicit interactions exist for that. Correlation is a redundancy check here, not a gate.",
      },
      {
        q: "How many features should you keep?",
        a: "As many as you can compute reliably and that survive a time-based ablation. I quote the metric change from dropping a group, not a magic count.",
      },
    ],
    pitfalls: [
      "Selecting features on the full dataset, then cross-validating the model. Selection must sit inside the fold.",
      "Dropping one of a correlated pair and being surprised the metric fell.",
      "Keeping a feature the serving API cannot see until tomorrow.",
    ],
  },
];
