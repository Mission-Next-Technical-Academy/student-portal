/* Module 08 — Neural Networks & Deep Learning Foundations ('ai-ml').
 * Content authored from AI_ML_ENGINEERING_CURRICULUM.md (2026-09-10).
 * Labs run in the student's own real Python environment (no in-portal code
 * execution sandbox exists) — completion is tracked as a guided step
 * checklist plus short written reflections, evidence-based like
 * it-support-module-01.js's Lab 1.1, not a simulated console.
 * Reference implementation for the ai-ml-module-02..12.js pattern.
 */

const AIM08_LESSONS = [
  {
    id: 'aim08-lesson-01', number: '8.1', icon: 'ri-braces-line',
    title: 'The Perceptron & Multi-Layer Networks', minutes: 90,
    learn: [
      'How a single perceptron computes a weighted sum and applies an activation function',
      'Why stacking perceptrons into layers allows a network to learn non-linear patterns',
      'The difference between a shallow network and a deep one',
    ],
    topics: [
      { heading: 'The Perceptron', body: 'A perceptron takes a vector of inputs, multiplies each by a learned weight, adds a bias, and passes the result through an activation function to produce an output. This single unit can learn a linear decision boundary; stacked with others, it becomes a building block for learning complex patterns.' },
      { heading: 'Layers and Depth', body: 'A multi-layer network chains perceptrons: the output of one layer feeds into the next. Each layer transforms the representation further. Shallow networks (1–2 hidden layers) struggle with high-dimensional data; deep networks (many layers) can learn hierarchical representations, but become harder to train (vanishing gradients, computational cost).' },
    ],
    practice: [
      'Sketch a 2-layer network diagram with 2 inputs, a 3-unit hidden layer, and 1 output; label the weights and biases.',
      'Compute forward-pass outputs by hand for a simple 2-input perceptron given specific weights and inputs.',
    ],
    comingUp: 'You\'ll implement exactly this forward pass in NumPy in the first lab — converting your sketch to working code.',
  },
  {
    id: 'aim08-lesson-02', number: '8.2', icon: 'ri-function-line',
    title: 'Activation Functions', minutes: 75,
    learn: [
      'Why networks need non-linear activation functions to learn non-linear patterns',
      'The properties and trade-offs of sigmoid, tanh, and ReLU',
      'Why ReLU has become the standard activation in hidden layers and its variants',
    ],
    topics: [
      { heading: 'Non-linearity', body: 'A network built from only linear operations (matrix multiplies and adds) collapses into a single linear transformation — no amount of depth helps. An activation function introduces non-linearity, allowing the network to bend and twist the decision boundary.' },
      { heading: 'Sigmoid & Tanh', body: 'Sigmoid (output: 0 to 1) is historically common for outputs and was once standard for hidden layers; tanh (output: −1 to 1) is centered and slightly stronger. Both compress gradients to a small range, which caused the vanishing-gradient problem in deep networks — gradients shrink exponentially as they backpropagate through many layers.' },
      { heading: 'ReLU and Variants', body: 'ReLU (Rectified Linear Unit) outputs max(0, x) — simple, cheap to compute, and crucially: does not saturate on positive values, so gradients stay large. This solved the vanishing-gradient problem and enabled training of very deep networks. Variants like Leaky ReLU (small negative slope) and GELU smooth the kink for edge cases but ReLU remains the default.' },
    ],
    practice: [
      'Plot sigmoid, tanh, and ReLU on the same graph from −3 to 3; mark where gradients get small.',
      'Explain why a network with no activation functions (linear throughout) cannot separate two overlapping Gaussian clouds.',
    ],
    comingUp: 'You\'ll use ReLU in your PyTorch network in the framework lab; see first-hand how it trains faster than tanh.',
  },
  {
    id: 'aim08-lesson-03', number: '8.3', icon: 'ri-database-2-line',
    title: 'Forward Pass, Loss Functions & Backpropagation', minutes: 90,
    learn: [
      'How the forward pass computes layer-by-layer predictions',
      'What a loss function measures and why cross-entropy suits classification',
      'How backpropagation uses the chain rule to compute gradients for every weight',
    ],
    topics: [
      { heading: 'Forward Pass', body: 'The forward pass flows left to right: input → hidden layer (compute activation after weights) → output layer (compute final output, no activation for regression or softmax for classification). Each intermediate value is cached because the backward pass needs it to compute gradients.' },
      { heading: 'Loss Functions', body: 'Mean Squared Error (MSE, for regression) penalizes prediction-target distance squared; cross-entropy (for classification) is the negative log probability of the correct class and is more numerically stable. The loss is the single scalar you want to minimize.' },
      { heading: 'Backpropagation', body: 'Backpropagation applies the chain rule backward through the network: compute how much the output loss changed due to the final layer\'s weights, then how much those weights depended on the previous layer, and so on. This produces a gradient for every parameter — the direction and magnitude to nudge it to reduce loss.' },
    ],
    practice: [
      'Trace the forward pass by hand for a 2-layer network on a single input; compute the loss.',
      'For a single weight, describe the path the chain rule follows during backpropagation to get its gradient.',
    ],
    comingUp: 'The framework handles backpropagation automatically (PyTorch.autograd), but understanding the chain rule is essential for debugging diverging training.',
  },
  {
    id: 'aim08-lesson-04', number: '8.4', icon: 'ri-error-warning-line',
    title: 'Gradient Descent & Optimization Variants', minutes: 75,
    learn: [
      'How gradient descent updates weights step-by-step in the direction of negative gradient',
      'How momentum, adaptive learning rates, and Adam change the update rule',
      'When and why you might choose SGD, momentum SGD, or Adam',
    ],
    topics: [
      { heading: 'Vanilla Gradient Descent', body: 'At each step, compute the gradient and update each weight by weight := weight - learning_rate * gradient. The learning rate controls step size; too small and training is slow, too large and you overshoot and diverge. Batch Gradient Descent (GD) uses all data; Stochastic GD (SGD) uses one or a few samples per update, which is faster and introduces noise that can help escape local minima.' },
      { heading: 'Momentum', body: 'Instead of moving purely in the gradient direction, momentum keeps a running "velocity" vector and accelerates in directions that are consistently downhill. This smooths the path and speeds up convergence, especially in ravine-like loss surfaces.' },
      { heading: 'Adaptive Methods: Adam', body: 'Adam (Adaptive Moment Estimation) maintains a running average of gradients and squared gradients, giving each parameter its own effective learning rate. Parameters with consistently small gradients get larger steps; noisy ones get smaller steps. Adam often converges faster than SGD and is less sensitive to learning-rate tuning, making it a go-to default.' },
    ],
    practice: [
      'Write out one update step: weight := weight - lr * gradient for a single weight.',
      'Describe when momentum helps: which loss surfaces benefit from acceleration?',
    ],
    comingUp: 'You\'ll use Adam by default in the PyTorch loop (torch.optim.Adam); we\'ll compare its convergence to vanilla SGD if training runs slower than expected.',
  },
  {
    id: 'aim08-lesson-05', number: '8.5', icon: 'ri-terminal-box-line',
    title: 'Learning Rates & Training Dynamics', minutes: 75,
    learn: [
      'How the learning rate controls convergence speed and stability',
      'Symptoms of learning rates that are too high, too low, or just right',
      'How learning-rate schedules can improve both convergence and final accuracy',
    ],
    topics: [
      { heading: 'Learning Rate Effects', body: 'Too low: training crawls (hundreds of epochs for convergence). Too high: loss oscillates wildly or diverges (weights explode). Just right: smooth, steady decrease in loss. Finding the right rate is an art — start with 0.001 for Adam, adjust up or down by 10× increments, and look at loss curves.' },
      { heading: 'Learning-Rate Schedules', body: 'A schedule reduces the learning rate over time: step decay (cut by 10× every N epochs), exponential decay (multiply by 0.95 each epoch), or warm restarts (reset to a higher rate periodically). Early epochs benefit from a higher rate (explore); later epochs use a lower rate (fine-tune).' },
      { heading: 'Debugging Divergence', body: 'If loss spikes to NaN or inf, the learning rate was too high — reduce it by 10×. If loss plateaus early, the rate was too low — increase it. Monitor loss curves and log intermediate activations; explosion at any layer signals a gradient problem upstream.' },
    ],
    practice: [
      'Sketch three loss curves: one for LR too high, one too low, one just right.',
      'Propose a learning-rate schedule for 100 epochs: what rate for epochs 0–20, 20–80, 80–100?',
    ],
    comingUp: 'In the framework lab, you\'ll plot training curves and adjust learning rates if needed; this is the first tuning knob to turn when convergence stalls.',
  },
  {
    id: 'aim08-lesson-06', number: '8.6', icon: 'ri-focus-2-line',
    title: 'Overfitting & Regularization Techniques', minutes: 85,
    learn: [
      'How to recognize overfitting from diverging train/validation loss curves',
      'How dropout, weight decay (L2 regularization), and early stopping combat overfitting',
      'When and how to apply batch normalization to stabilize training',
    ],
    topics: [
      { heading: 'Overfitting Symptom', body: 'Training loss keeps decreasing but validation loss plateaus then climbs — the network memorizes the training set instead of learning generalizable patterns. Common when a model is over-parameterized (more weights than training samples) or trained for too long.' },
      { heading: 'Dropout', body: 'Dropout randomly zeroes out a fraction (e.g., 50%) of neurons each forward pass during training. This forces the network to learn redundant representations and prevents co-dependence between neurons. At inference, use all neurons (optionally scaled). Dropout is cheap and powerful: add a Dropout(0.5) layer after each hidden layer and watch validation loss stop diverging.' },
      { heading: 'Weight Decay & Early Stopping', body: 'Weight decay (L2 regularization) adds a small penalty for large weights to the loss, encouraging the network to stay small. Early stopping monitors validation loss and halts training when it stops improving for N epochs — simple and often most effective. Combining both is common: train with dropout + weight decay, stop when validation loss plateaus.' },
      { heading: 'Batch Normalization', body: 'Batch norm normalizes layer outputs to zero mean and unit variance within each batch, then rescales with learned parameters. This stabilizes training (allows higher learning rates), acts as a regularizer, and sometimes even makes dropout unnecessary. Add torch.nn.BatchNorm1d between layers in dense networks.' },
    ],
    practice: [
      'Sketch a training curve showing train/val divergence; mark where early stopping should trigger.',
      'Given a network that overfits badly, list three changes in order: which do you try first?',
    ],
    comingUp: 'The third lab exercise is all about applying these techniques: train an over-parameterized net until it overfits, then add dropout or early stopping and show the fix in your reflection.',
  },
];

const AIM08_QUIZ_BANKS = [
  {
    conceptId: 'aim08-architecture-forward-pass', conceptTitle: 'Architecture & forward pass', questions: [
      { id: 'aim08-q-afp-1', prompt: 'In a feedforward network, the forward pass computes:', options: [
        { id: 'a', text: 'The gradient of the loss with respect to weights' },
        { id: 'b', text: 'The predicted output from the input, layer by layer' },
        { id: 'c', text: 'Only the final accuracy' },
        { id: 'd', text: 'The learning rate' },
      ], correctId: 'b', feedbackCorrect: 'Correct — the forward pass flows left to right, computing activations layer by layer until the final output.', feedbackIncorrect: 'The forward pass flows left to right through the network, computing activations layer by layer, producing a prediction for each input.' },
      { id: 'aim08-q-afp-2', prompt: 'ReLU is widely used in hidden layers MAINLY because it:', options: [
        { id: 'a', text: 'Always outputs values between 0 and 1' },
        { id: 'b', text: 'Is computationally simple and mitigates the vanishing-gradient problem better than sigmoid/tanh in deep networks' },
        { id: 'c', text: 'Guarantees convergence' },
        { id: 'd', text: 'Removes the need for backpropagation' },
      ], correctId: 'b', feedbackCorrect: 'Correct — ReLU avoids saturation on positive values, keeping gradients large and enabling efficient training of very deep networks.', feedbackIncorrect: 'ReLU remains unsaturated on positive inputs, allowing large gradients to flow backward — this solved the vanishing-gradient problem and enabled deep networks.' },
    ],
  },
  {
    conceptId: 'aim08-training', conceptTitle: 'Training', questions: [
      { id: 'aim08-q-train-1', prompt: 'Backpropagation is BEST described as:', options: [
        { id: 'a', text: 'A method for cleaning training data' },
        { id: 'b', text: 'An algorithm that computes gradients of the loss with respect to each weight, using the chain rule, to update the network' },
        { id: 'c', text: 'A type of activation function' },
        { id: 'd', text: 'A regularization technique' },
      ], correctId: 'b', feedbackCorrect: 'Correct — backpropagation is the chain-rule algorithm that flows gradients backward through the network to every parameter.', feedbackIncorrect: 'Backpropagation applies the chain rule backward through the network to compute how each weight should change to reduce the loss.' },
      { id: 'aim08-q-train-2', prompt: 'A learning rate set far too high during training MOST likely causes:', options: [
        { id: 'a', text: 'Slow but stable convergence' },
        { id: 'b', text: 'Loss that oscillates wildly or diverges instead of decreasing' },
        { id: 'c', text: 'Guaranteed overfitting only' },
        { id: 'd', text: 'No effect on training' },
      ], correctId: 'b', feedbackCorrect: 'Correct — too high a learning rate causes weight updates to overshoot, resulting in wild oscillations or divergence.', feedbackIncorrect: 'A learning rate that is too high causes weight updates to overshoot, making loss oscillate wildly or spike to infinity.' },
    ],
  },
  {
    conceptId: 'aim08-overfitting-regularization', conceptTitle: 'Overfitting & regularization', questions: [
      { id: 'aim08-q-overfit-1', prompt: 'Training loss keeps decreasing while validation loss starts increasing after epoch 10. The BEST immediate response is:', options: [
        { id: 'a', text: 'Keep training for many more epochs regardless' },
        { id: 'b', text: 'Apply early stopping around where validation loss starts rising, and consider dropout or weight decay' },
        { id: 'c', text: 'Increase the learning rate' },
        { id: 'd', text: 'Remove the validation set' },
      ], correctId: 'b', feedbackCorrect: 'Correct — this is the textbook sign of overfitting; stop there and add regularization to future runs.', feedbackIncorrect: 'When validation loss rises while training loss falls, the network is overfitting; stop at the valley and add dropout or weight decay for next time.' },
      { id: 'aim08-q-overfit-2', prompt: 'Dropout during training works by:', options: [
        { id: 'a', text: 'Removing data points from the dataset permanently' },
        { id: 'b', text: 'Randomly zeroing out a fraction of neurons each forward pass, which discourages co-dependence between neurons' },
        { id: 'c', text: 'Lowering the learning rate automatically' },
        { id: 'd', text: 'Reducing the number of layers permanently' },
      ], correctId: 'b', feedbackCorrect: 'Correct — dropout forces the network to learn redundant representations, preventing over-reliance on specific neurons.', feedbackIncorrect: 'Dropout stochastically silences neurons during training, forcing the network to learn robust, redundant representations.' },
    ],
  },
];

const AIM08_BLANKS = [
  { id: 'aim08-b1', prompt: 'A ______ function introduces non-linearity into a neural network; without one, stacked layers would collapse into a single linear transformation.', accept: ['activation'] },
  { id: 'aim08-b2', prompt: '______ computes gradients of the loss with respect to each weight by applying the chain rule backward through the network.', accept: ['Backpropagation'] },
  { id: 'aim08-b3', prompt: '______ is a regularization technique that randomly deactivates a fraction of neurons during training.', accept: ['Dropout'] },
  { id: 'aim08-b4', prompt: '______ descent iteratively updates weights in the direction that reduces the loss function.', accept: ['Gradient'] },
];

const AIM08_SOURCES = [
  { title: 'Deep Learning — Goodfellow, Bengio & Courville', org: 'MIT Press', url: 'https://www.deeplearningbook.org/', note: 'The standard free reference for the math behind this module.' },
  { title: 'Dive into Deep Learning (d2l.ai)', org: 'd2l.ai', url: 'https://d2l.ai/', note: 'Interactive, code-first companion covering the same material with runnable notebooks.' },
  { title: 'PyTorch documentation', org: 'PyTorch', url: 'https://docs.pytorch.org/docs/stable/index.html', note: 'nn.Module, autograd, and the training-loop API used in the labs.' },
];

const AIM08_LAB_ID = 'aim08-neural-network-v1';
const AIM08_LAB_KEY = 'lab-aim-08-neural-network';

const AIM08_LAB_STEPS = [
  { id: 'numpy-forward', label: 'Implemented forward propagation for a 2-layer network in NumPy (no framework).' },
  { id: 'numpy-backward', label: 'Implemented backpropagation and gradient descent updates for the same network.' },
  { id: 'numpy-train', label: 'Trained the NumPy network on a small synthetic dataset and verified loss decreased.' },
  { id: 'pytorch-rebuild', label: 'Rebuilt the same architecture in PyTorch using nn.Module and defined a training loop.' },
  { id: 'pytorch-train', label: 'Trained on a real image or tabular dataset, tracking training and validation loss per epoch.' },
  { id: 'overfit-create', label: 'Trained a deliberately over-parameterized network until validation loss diverged from training loss.' },
  { id: 'overfit-fix', label: 'Applied dropout and/or early stopping; verified training/validation curves converged again.' },
];

const AIM08_DEFAULT_STATE = {
  stepsDone: {}, reflection: '', reflectionChecked: false,
  reviewMode: false,
  blankAnswers: {}, blankResults: {},
  repoUrl: '', demoUrl: '', repoUrlTouched: false,
};

/* Real-product deliverable, per AI_ML_APPLIED_BUILD_TRACK.md (Model B —
 * student's own GitHub, one small repo per project module). */
function aim08IsValidUrl(value) {
  return /^https?:\/\/.+\..+/.test((value || '').trim());
}

function aim08LabComplete() {
  const allDone = AIM08_LAB_STEPS.every((step) => aim08State.stepsDone[step.id]);
  const reflectionOk = aim08State.reflection.trim().length >= 40;
  const repoOk = aim08IsValidUrl(aim08State.repoUrl);
  return allDone && reflectionOk && repoOk;
}

let aim08State = null;
let aim08User = null;
let aim08QuizState = null;

function aim08Load(user) {
  aim08User = user;
  aim08State = LabRuntime.load(AIM08_LAB_ID, user, AIM08_DEFAULT_STATE);
  if (!aim08State.stepsDone || typeof aim08State.stepsDone !== 'object') aim08State.stepsDone = {};
  if (!aim08State.blankAnswers) aim08State.blankAnswers = {};
  if (!aim08State.blankResults) aim08State.blankResults = {};

  if (!aim08QuizState) {
    const previousQuestionIds = aim08State.lastQuizQuestionIds || [];
    const selection = selectQuizQuestions(AIM08_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
    aim08QuizState = {
      selectedQuestions: selection.selectedQuestions,
      questionsByAnswer: selection.questionsByAnswer,
      answers: {}, scored: false, attempts: 0, score: 0, bestScore: 0, feedback: [], passed: false,
    };
  }

  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'ai-ml', 'aim-08');
  return aim08State;
}

function aim08Save() {
  if (aim08User && aim08State) LabRuntime.save(AIM08_LAB_ID, aim08User, aim08State);
}

/* -------------------------------------------------------------- lessons */

function aim08LessonCard(lesson) {
  return `<details class="aim-lesson" data-aim08-lesson="${esc(lesson.id)}" ${aim08State.reviewMode ? 'open' : ''}>
    <summary><span class="aim-lesson-icon"><i class="${esc(lesson.icon)}" aria-hidden="true"></i></span><span><strong>Lesson ${esc(lesson.number)} · ${esc(lesson.title)}</strong><small>${formatInstructionalMinutes(lesson.minutes)}</small></span><i class="ri-arrow-down-s-line aim-lesson-chevron" aria-hidden="true"></i></summary>
    <div class="aim-lesson-body">
      <h4>What You'll Learn</h4>
      <ul>${lesson.learn.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
      ${lesson.topics.map((topic) => `<div class="aim-lesson-topic"><strong>${esc(topic.heading)}</strong><p>${esc(topic.body)}</p></div>`).join('')}
      <div class="aim-practice"><strong><i class="ri-flashlight-line" aria-hidden="true"></i> Try It Yourself</strong><ol>${lesson.practice.map((item) => `<li>${esc(item)}</li>`).join('')}</ol></div>
      <p class="aim-instruction" style="margin-top:10px"><strong>Coming up in your lab:</strong> ${esc(lesson.comingUp)}</p>
    </div>
  </details>`;
}

/* -------------------------------------------------------------- fill-in-the-blank */

function aim08BlankItem(blank) {
  const value = aim08State.blankAnswers[blank.id] || '';
  const result = aim08State.blankResults[blank.id];
  const statusClass = result === true ? 'is-correct' : result === false ? 'is-incorrect' : '';
  return `<li class="aim-blank-item ${statusClass}" data-aim08-blank="${esc(blank.id)}">
    <p class="aim-blank-prompt">${esc(blank.prompt)}</p>
    <div class="aim-blank-row">
      <input type="text" value="${esc(value)}" data-aim08-blank-input="${esc(blank.id)}" aria-label="Your answer" autocomplete="off" />
      <button type="button" class="aim-blank-check" data-aim08-blank-check="${esc(blank.id)}">Check</button>
    </div>
    ${result === true ? '<p class="aim-blank-result">Correct.</p>' : ''}
    ${result === false ? `<p class="aim-blank-result">Not quite — expected: ${esc(blank.accept[0])}</p>` : ''}
  </li>`;
}

function aim08BlankDrill() {
  return `<ul class="aim-blank-list">${AIM08_BLANKS.map(aim08BlankItem).join('')}</ul>`;
}

/* -------------------------------------------------------------- quiz */

function aim08QuizQuestion(selected, index) {
  const question = selected.question;
  const userAnswerId = aim08QuizState?.answers?.[question.id];
  return `<fieldset class="aim-quiz-question" data-question-id="${esc(question.id)}">
    <legend><span>${index + 1}</span> ${esc(selected.conceptTitle)}: ${esc(question.prompt)}</legend>
    <div class="aim-quiz-options">
      ${selected.shuffledOptions.map((option) => `<label>
        <input type="radio" name="q-${esc(question.id)}" value="${esc(option.id)}" ${userAnswerId === option.id ? 'checked' : ''} data-aim08-quiz-answer />
        <span>${esc(option.text)}</span>
      </label>`).join('')}
    </div>
  </fieldset>`;
}

function aim08QuizPanel() {
  if (!aim08QuizState?.selectedQuestions || aim08QuizState.selectedQuestions.length === 0) {
    return `<div class="aim-quiz-empty" id="aim08-quiz-feedback" role="status">Loading quiz…</div>`;
  }
  const selected = aim08QuizState.selectedQuestions;
  const answered = Object.keys(aim08QuizState.answers || {}).length;
  const total = selected.length;

  let feedbackHtml = '';
  if (aim08QuizState.scored) {
    const passed = aim08QuizState.score >= 70;
    feedbackHtml = `<section class="aim-quiz-score ${passed ? 'aim-quiz-pass' : 'aim-quiz-remediate'}" id="aim08-quiz-feedback" tabindex="-1" aria-live="polite">
      <div class="aim-quiz-score-heading">
        <div><p class="aim-kicker">Attempt ${aim08QuizState.attempts} · best ${aim08QuizState.bestScore}/100</p><h3>${aim08QuizState.score}/100 — ${passed ? 'Knowledge check passed' : 'Review and retry'}</h3></div>
        <span>${aim08QuizState.score}</span>
      </div>
      <ul class="aim-quiz-feedback-list">${(aim08QuizState.feedback || []).map((fb) => `<li>
        <i class="ri-${fb.correct ? 'checkbox-circle-fill' : 'information-line'}" aria-hidden="true"></i>
        <div><strong>${fb.correct ? 'Correct' : 'Review'}</strong><p>${esc(fb.message)}</p></div>
      </li>`).join('')}</ul>
      ${!passed ? `<div class="aim-quiz-actions"><button type="button" class="aim-quiz-retry" data-aim08-quiz-retry><i class="ri-refresh-line" aria-hidden="true"></i> Try different questions</button></div>` : ''}
    </section>`;
  } else if (answered === total) {
    feedbackHtml = `<div class="aim-quiz-ready" id="aim08-quiz-feedback" role="status">All questions answered. Submit to check your responses.</div>`;
  } else {
    feedbackHtml = `<div class="aim-quiz-empty" id="aim08-quiz-feedback" role="status">Answer all ${total} questions to submit.</div>`;
  }

  return `<form class="aim-quiz-form" id="aim08-quiz-form" novalidate>
    <div class="aim-panel-heading"><div><p class="aim-kicker">Knowledge check</p><h3>Test your understanding of neural networks</h3></div><span>${answered}/${total} answered</span></div>
    ${selected.map((sel, idx) => aim08QuizQuestion(sel, idx)).join('')}
    <div class="aim-quiz-actions">
      <button class="aim-quiz-submit" type="submit" ${answered < total ? 'disabled' : ''}><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Check my answers</button>
    </div>
    ${feedbackHtml}
  </form>`;
}

/* -------------------------------------------------------------- lab */

function aim08LabStepItem(step) {
  const done = Boolean(aim08State.stepsDone[step.id]);
  return `<li class="aim-lab-step ${done ? 'is-done' : ''}"><input type="checkbox" id="aim08-step-${esc(step.id)}" data-aim08-step="${esc(step.id)}" ${done ? 'checked' : ''} /><label for="aim08-step-${esc(step.id)}"><span>${esc(step.label)}</span></label></li>`;
}

function aim08LabStatus() {
  const complete = aim08LabComplete();
  return `<div class="aim-lab-status ${complete ? 'aim-status-pass' : 'aim-status-pending'}"><i class="${complete ? 'ri-checkbox-circle-fill' : 'ri-time-line'}" aria-hidden="true"></i><span>${complete ? 'Lab complete — every step is checked, your reflection is recorded, and your repository URL is saved.' : 'Check off every step in your own Python environment, record a short reflection, and paste your repository URL.'}</span></div>`;
}

function aim08RepoFields() {
  const repoInvalid = aim08State.repoUrlTouched && aim08State.repoUrl.trim() && !aim08IsValidUrl(aim08State.repoUrl);
  return `<div class="aim-repo-fields">
    <div class="aim-repo-field">
      <label for="aim08-repo-url">Repository URL (required)</label>
      <input type="url" id="aim08-repo-url" data-aim08-repo-url value="${esc(aim08State.repoUrl)}" placeholder="https://github.com/your-username/aiml-08-neural-network" ${repoInvalid ? 'class="is-invalid"' : ''} />
      ${repoInvalid ? '<small class="aim-repo-error">That doesn\'t look like a full URL (e.g. https://github.com/you/repo).</small>' : '<small>Push your NumPy-from-scratch and PyTorch implementations to a public or private repo (your own GitHub account) and paste the URL here.</small>'}
    </div>
    <div class="aim-repo-field">
      <label for="aim08-demo-url">Live demo / recording URL (optional)</label>
      <input type="url" id="aim08-demo-url" data-aim08-demo-url value="${esc(aim08State.demoUrl)}" placeholder="https://..." />
      <small>Optional — a link to your training/validation loss curve plots or a short recording of the training run.</small>
    </div>
  </div>`;
}

function aim08LabPanel() {
  return `
    <ol class="aim-lab-steps">${AIM08_LAB_STEPS.map(aim08LabStepItem).join('')}</ol>
    <div class="aim-reflection">
      <label for="aim08-reflection">Describe what the training/validation loss curves looked like before and after applying dropout or early stopping, and why that change fixed the overfitting.</label>
      <textarea id="aim08-reflection" data-aim08-reflection rows="4">${esc(aim08State.reflection)}</textarea>
      <small>Write at least a couple of sentences — this is your evidence that you debugged overfitting in a real network.</small>
    </div>
    ${aim08RepoFields()}
    ${aim08LabStatus()}
  `;
}

/* -------------------------------------------------------------- shell */

function aim08Sections() {
  const labComplete = aim08LabComplete();
  return [
    { id: 'aim08-lessons', title: 'Foundations', type: 'lecture', isComplete: true, scrollId: 'aim08-lessons' },
    { id: 'aim08-knowledge-check', title: 'Knowledge Check', type: 'quiz', isComplete: Boolean(aim08QuizState?.passed), scrollId: 'aim08-knowledge-check' },
    { id: 'aim08-lab', title: 'Hands-On Lab', type: 'lab', isComplete: labComplete, scrollId: 'aim08-lab' },
  ];
}

function viewAiMlModuleEight(user, program) {
  aim08Load(user);
  const module = program.modules['aim-08'];

  return `<div class="aim-shell">
    ${moduleTopbar(user, program)}
    ${moduleProgressShell(aim08Sections(), { reviewMode: aim08State.reviewMode })}
    <main class="aim-main">
      <section class="aim-hero" aria-labelledby="aim08-title">
        <div>
          <p class="aim-kicker">Module 08 · ${formatInstructionalMinutes(module.durationMinutes)} · Week 4</p>
          <h1 id="aim08-title">${esc(module.title)}</h1>
          <p class="aim-lede">${esc(module.summary)}</p>
        </div>
        <dl class="aim-progress" aria-label="Saved module progress">
          <div><dt>Lessons</dt><dd>${module.lessons}</dd></div>
          <div><dt>Hands-on labs</dt><dd>${module.labs}</dd></div>
        </dl>
      </section>

      <section class="aim-objective" aria-labelledby="aim08-objective-title"><span><i class="ri-focus-2-line" aria-hidden="true"></i></span><div><p class="aim-kicker">One measurable objective</p><h2 id="aim08-objective-title">Build a feedforward neural network from scratch in NumPy, then train it in a modern framework (PyTorch or TensorFlow), and diagnose and fix overfitting using regularization techniques.</h2></div></section>

      <details class="aim-section-collapsible" id="aim08-lessons" ${aim08State.reviewMode ? 'open' : 'open'}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>1</span><div><p class="aim-kicker">Learn</p><h2>Six core lessons</h2></div></div></summary>
        <div class="aim-section-body">
          <p class="aim-instruction">Open each lesson for the full walkthrough, then work its Try It Yourself exercise in your own Python environment.</p>
          <div class="aim-lesson-grid">${AIM08_LESSONS.map(aim08LessonCard).join('')}</div>
        </div>
      </details>

      <details class="aim-section-collapsible" id="aim08-blanks" ${aim08State.reviewMode ? 'open' : ''}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>2</span><div><p class="aim-kicker">Vocabulary drill</p><h2>Fill in the blank</h2></div></div></summary>
        <div class="aim-section-body">${aim08BlankDrill()}</div>
      </details>

      <details class="aim-section-collapsible" id="aim08-knowledge-check" ${aim08State.reviewMode || (aim08QuizState && !aim08QuizState.passed) ? 'open' : ''}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>3</span><div><p class="aim-kicker">Interactive knowledge check</p><h2>Test your understanding</h2></div></div></summary>
        <div class="aim-section-body"><div id="aim08-quiz-dynamic">${aim08QuizPanel()}</div></div>
      </details>

      <details class="aim-section-collapsible" id="aim08-lab" ${aim08State.reviewMode ? 'open' : 'open'}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>4</span><div><p class="aim-kicker">Hands-on · your own environment</p><h2>Neural Network From Scratch, Framework Training Loop &amp; Overfitting</h2></div></div></summary>
        <div class="aim-section-body">
          <p class="aim-instruction">Work all three labs in your own Python environment: build a network from scratch with NumPy, rebuild it in PyTorch, and train until overfitting then apply fixes. Check off each step below as you complete it.</p>
          <div id="aim08-lab-dynamic">${aim08LabPanel()}</div>
        </div>
      </details>

      <details class="aim-section-collapsible" id="aim08-sources" ${aim08State.reviewMode ? 'open' : ''}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>5</span><div><p class="aim-kicker">Supporting resources</p><h2>Further reading</h2></div></div></summary>
        <div class="aim-section-body">${moduleSourcesBlock(AIM08_SOURCES)}</div>
      </details>
    </main>
  </div>`;
}

/* -------------------------------------------------------------- render helpers */

function aim08RenderQuiz(focusId) {
  const el = document.getElementById('aim08-quiz-dynamic');
  if (!el) return;
  el.innerHTML = aim08QuizPanel();
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function aim08RenderLab() {
  const el = document.getElementById('aim08-lab-dynamic');
  if (!el) return;
  el.innerHTML = aim08LabPanel();
}

function aim08CheckLabComplete(wasComplete) {
  const nowComplete = aim08LabComplete();
  if (nowComplete && !wasComplete) {
    if (typeof recordLabAttempt === 'function') recordLabAttempt(aim08User, AIM08_LAB_KEY, { state: 'complete', score: 100, result: { steps: AIM08_LAB_STEPS.length, repoUrl: aim08State.repoUrl, demoUrl: aim08State.demoUrl || null } });
    if (typeof markModuleLabComplete === 'function') markModuleLabComplete(aim08User, 'ai-ml', 'aim-08', AIM08_LAB_KEY);
  }
  return nowComplete;
}

/* -------------------------------------------------------------- wiring */

function wireAiMlModuleEight() {
  const shell = document.querySelector('.aim-shell');
  if (!shell || !aim08State) return;

  shell.addEventListener('click', (event) => {
    if (event.target.closest('[data-mnav-review-toggle]')) {
      aim08State.reviewMode = !aim08State.reviewMode;
      aim08Save();
      render();
      return;
    }
    const blankCheck = event.target.closest('[data-aim08-blank-check]');
    if (blankCheck) {
      const id = blankCheck.dataset.aim08BlankCheck;
      const blank = AIM08_BLANKS.find((b) => b.id === id);
      const input = shell.querySelector(`[data-aim08-blank-input="${id}"]`);
      const given = (input?.value || '').trim().toLowerCase();
      aim08State.blankResults[id] = blank.accept.some((accepted) => accepted.toLowerCase() === given);
      aim08Save();
      const item = shell.querySelector(`[data-aim08-blank="${id}"]`);
      if (item) item.outerHTML = aim08BlankItem(blank);
      return;
    }
    const retry = event.target.closest('[data-aim08-quiz-retry]');
    if (retry) {
      const previousQuestionIds = aim08QuizState.selectedQuestions.map((s) => s.question.id);
      const selection = selectQuizQuestions(AIM08_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
      aim08QuizState = { selectedQuestions: selection.selectedQuestions, questionsByAnswer: selection.questionsByAnswer, answers: {}, scored: false, attempts: aim08QuizState.attempts, score: 0, bestScore: aim08QuizState.bestScore, feedback: [], passed: false };
      aim08State.lastQuizQuestionIds = previousQuestionIds;
      aim08Save();
      aim08RenderQuiz('aim08-quiz-title');
    }
  });

  shell.addEventListener('input', (event) => {
    if (event.target.matches('[data-aim08-blank-input]')) {
      const id = event.target.dataset.aim08BlankInput;
      aim08State.blankAnswers[id] = event.target.value;
      aim08Save();
      return;
    }
    if (event.target.matches('[data-aim08-reflection]')) {
      const wasComplete = aim08LabComplete();
      aim08State.reflection = event.target.value;
      aim08CheckLabComplete(wasComplete);
      aim08Save();
      return;
    }
    if (event.target.matches('[data-aim08-repo-url]')) {
      const wasComplete = aim08LabComplete();
      aim08State.repoUrl = event.target.value;
      aim08CheckLabComplete(wasComplete);
      aim08Save();
      return;
    }
    if (event.target.matches('[data-aim08-demo-url]')) {
      aim08State.demoUrl = event.target.value;
      aim08Save();
    }
  });

  shell.addEventListener('blur', (event) => {
    if (!event.target.matches('[data-aim08-repo-url]')) return;
    aim08State.repoUrlTouched = true;
    aim08Save();
    aim08RenderLab();
  }, true);

  shell.addEventListener('change', (event) => {
    if (event.target.matches('[data-aim08-step]')) {
      const wasComplete = aim08LabComplete();
      const id = event.target.dataset.aim08Step;
      aim08State.stepsDone[id] = event.target.checked;
      aim08CheckLabComplete(wasComplete);
      aim08Save();
      aim08RenderLab();
      return;
    }
    if (event.target.matches('[data-aim08-quiz-answer]')) {
      const questionId = event.target.closest('[data-question-id]')?.dataset.questionId;
      if (questionId) {
        aim08QuizState.answers[questionId] = event.target.value;
        aim08State.lastQuizQuestionIds = aim08QuizState.selectedQuestions.map((s) => s.question.id);
        aim08Save();
        aim08RenderQuiz();
      }
    }
  });

  shell.addEventListener('submit', (event) => {
    if (event.target.id !== 'aim08-quiz-form') return;
    event.preventDefault();
    const result = scoreQuizAttempt(aim08QuizState.selectedQuestions, aim08QuizState.questionsByAnswer, aim08QuizState.answers);
    aim08QuizState.attempts += 1;
    aim08QuizState.score = result.score;
    aim08QuizState.bestScore = Math.max(aim08QuizState.bestScore || 0, result.score);
    aim08QuizState.feedback = result.feedback;
    aim08QuizState.passed = result.score >= 70;
    aim08QuizState.scored = true;
    if (typeof recordLabAttempt === 'function') {
      recordLabAttempt(aim08User, 'aim-08-knowledge-check', { state: aim08QuizState.passed ? 'complete' : 'in_progress', score: result.score });
    }
    aim08Save();
    aim08RenderQuiz('aim08-quiz-feedback');
  });
}

registerModuleLab({
  program: 'ai-ml',
  moduleNumber: 8,
  moduleKey: 'aim-08',
  view: viewAiMlModuleEight,
  wire: wireAiMlModuleEight,
});
