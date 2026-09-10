/* Module 09 — Applied AI: Language, Vision & Generative Models ('ai-ml').
 * Content authored from AI_ML_ENGINEERING_CURRICULUM.md (2026-09-10).
 * Labs run in the student's own real Python environment (no in-portal code
 * execution sandbox exists) — completion is tracked as a guided step
 * checklist plus short written reflections, evidence-based like
 * module-01.js's Lab 1.1, not a simulated console.
 * Reference implementation for the ai-ml-module-02..12.js pattern.
 */

const AIM09_LESSONS = [
  {
    id: 'aim09-lesson-01', number: '9.1', icon: 'ri-image-add-line',
    title: 'Convolutional Neural Networks for Images', minutes: 60,
    learn: [
      'How convolutional layers process spatial information more efficiently than fully-connected layers',
      'The roles of filters, pooling, and feature maps in extracting image patterns',
      'Why CNNs are the natural choice for vision tasks over pixel-by-pixel networks',
    ],
    topics: [
      { heading: 'Local Connectivity and Weight Sharing', body: 'A convolutional layer slides a small filter (e.g., 3×3 pixels) across an image and computes the same operation at every position. This is far more efficient than connecting every pixel to every neuron — a fully-connected layer on even a small 256×256 image would have millions of parameters. Convolution exploits the fact that useful patterns in images (edges, corners, textures) are local, and the same pattern matters everywhere.' },
      { heading: 'Filters and Feature Maps', body: 'Each filter learns to detect a specific pattern. An early filter might detect horizontal edges; a later filter might detect corners. When a filter slides across the input and produces its output, that output is called a feature map. Stacking multiple filters produces multiple feature maps, and each is a different view of what the input "looks like" through that particular pattern detector.' },
      { heading: 'Pooling and Hierarchical Features', body: 'Pooling layers (often max-pooling) reduce spatial resolution while keeping the most important information. A 2×2 max-pool takes the maximum value in each 2×2 region, halving the height and width. This makes the network more efficient and helps it focus on coarse, robust features early on and finer details later — a hierarchical representation of the image.' },
    ],
    practice: [
      'Visualize the output of a convolutional filter on a small image; predict which features it is detecting.',
      'Compare the parameter count of a fully-connected layer on raw pixels versus a convolutional layer with the same image size.',
    ],
    comingUp: 'Your first lab will load a pretrained CNN (ResNet) and adapt it to your own image dataset using transfer learning.',
  },
  {
    id: 'aim09-lesson-02', number: '9.2', icon: 'ri-repeat-line',
    title: 'Transfer Learning in Practice', minutes: 50,
    learn: [
      'How to reuse a model trained on one large task as the foundation for a new, smaller dataset',
      'Why fine-tuning only the final layers is often smarter than training from scratch',
      'How to compare training time and accuracy: frozen base versus end-to-end retraining',
    ],
    topics: [
      { heading: 'The Transfer Learning Premise', body: 'A CNN trained on millions of images (ImageNet) has already learned to detect edges, textures, shapes, and object parts in its early layers. When you have a smaller dataset (e.g., 500 medical X-ray images), you do not need to re-learn those foundational patterns. Instead, freeze the base layers and train only the top classification head on your new task. This often outperforms training from scratch on limited data because you are reusing robust, generalizable features.' },
      { heading: 'Frozen Base, Trained Head', body: 'Load a pretrained model, set all weights in the convolutional base to non-trainable ("frozen"), replace the final classification layer with new layers suited to your task, and train only the new layers. This is computationally fast and usually prevents overfitting on small datasets — the pretrained features are already generalized.' },
      { heading: 'Fine-Tuning and the Tradeoff', body: 'Once the head is trained, you can "unfreeze" the base and do a second pass with a very low learning rate, letting the base layers adapt slightly to your specific task. This gives the biggest accuracy gain but risks overfitting on small datasets. The tradeoff is speed and data size: more data and compute → fine-tune the whole model; limited data → keep the base frozen.' },
    ],
    practice: [
      'Load a pretrained ResNet, freeze its base, and train only the top 3 layers on a toy dataset.',
      'Measure training time and accuracy against a model trained end-to-end from random weights.',
    ],
    comingUp: 'Lab 1 walks you through exactly this: load ResNet, fine-tune the head, and benchmark the results.',
  },
  {
    id: 'aim09-lesson-03', number: '9.3', icon: 'ri-wireless-charging-line',
    title: 'Transformers and the Attention Mechanism', minutes: 55,
    learn: [
      'How self-attention lets a model relate any token to any other token, regardless of distance',
      'The high-level architecture of a transformer: encoders, decoders, and multi-head attention',
      'Why transformers became the foundation for modern language models',
    ],
    topics: [
      { heading: 'Self-Attention as a Lookup Mechanism', body: 'In a recurrent network, information flows left-to-right, and tokens far apart "forget" each other by the time it reaches the end. Self-attention computes a relevance score between every pair of tokens — "how much should token A look at token B?" — using learned query, key, and value matrices. This lets a token directly reference any other token, no matter how far away, as long as there is enough memory.' },
      { heading: 'Multi-Head Attention', body: 'A single attention head might focus on one type of relationship (e.g., subject-verb pairs). Multiple heads, running in parallel, can each focus on different relationships. A transformer layer has, say, 8 or 16 attention heads; together, they build a rich representation of how tokens relate. Each head has its own query/key/value matrices, so they learn different patterns.' },
      { heading: 'The Transformer Stack', body: 'A transformer is a stack of identical layers, each with multi-head attention, a feed-forward network, layer normalization, and residual connections. There is no recurrence, only attention and point-wise fully-connected layers applied in parallel at every position. This massively parallel structure, combined with attention is all you need (no RNNs), scales elegantly to billions of tokens and billions of parameters.' },
    ],
    practice: [
      'Sketch a small self-attention matrix for a 5-token sentence; predict which tokens attend to each other most.',
      'Count the approximate parameter count in a transformer layer with 12 heads, 768-dim embeddings, and a 3072-dim feed-forward hidden layer.',
    ],
    comingUp: 'Lesson 4 and Lab 2 will apply transformers to language and build a real LLM feature.',
  },
  {
    id: 'aim09-lesson-04', number: '9.4', icon: 'ri-text-block',
    title: 'Pretrained Language Models', minutes: 55,
    learn: [
      'How tokenization converts text into a sequence of integers that a model can process',
      'What embeddings are and why they capture meaning relationships between words and subwords',
      'The difference between fine-tuning and prompting, and when to use each',
    ],
    topics: [
      { heading: 'Tokenization and Subword Units', body: 'A language model does not ingest raw text; it first converts text to tokens — often subword units like BPE (Byte Pair Encoding) or WordPiece. The word "running" might become ["run", "ning"]. This lets the model handle rare words and new words at test time by composing them from seen subwords. A special vocabulary size (e.g., 50,000 tokens) defines how many distinct units exist; rare words and typos map to an UNK token.' },
      { heading: 'Word Embeddings and Semantic Space', body: 'Each token maps to a learned vector, its embedding. After training on massive text, embeddings capture meaning relationships: "king" − "man" + "woman" ≈ "queen". The embedding space is a continuous representation where similar words cluster together. Pre-trained embeddings transfer to new tasks because they encode linguistic patterns learned from billions of tokens.' },
      { heading: 'Fine-Tuning Versus Prompting', body: 'Fine-tuning updates the model weights on a task-specific dataset; this requires labeled data and computation but often gives the best accuracy. Prompting (or in-context learning) leaves weights unchanged and relies on the model to infer the task from a prompt and examples in the context window. For small datasets or one-off tasks, prompting is faster; for production systems where accuracy is critical, fine-tuning often wins.' },
    ],
    practice: [
      'Tokenize a sentence with a pretrained tokenizer (e.g., Hugging Face); notice which words split into subwords.',
      'Load pretrained embeddings and compute the cosine similarity between two semantically related words.',
    ],
    comingUp: 'Lab 2 applies a pretrained language model to a classification or question-answering task via an API or local inference.',
  },
  {
    id: 'aim09-lesson-05', number: '9.5', icon: 'ri-magic-line',
    title: 'Generative Models, LLM Patterns & Risks', minutes: 65,
    learn: [
      'What autoencoders, GANs, diffusion models, and generative language models are built for',
      'Common application patterns: prompting, retrieval-augmented generation (RAG), and function calling',
      'The main failure modes of generative models and one mitigation for each',
    ],
    topics: [
      { heading: 'Generative Model Families', body: 'An autoencoder compresses data to a lower-dimensional "bottleneck" and reconstructs it, learning a dense representation. A GAN (Generative Adversarial Network) pits a generator against a discriminator; the generator learns to fool the discriminator, and the discriminator learns to detect fakes — an adversarial dance that produces realistic samples. A diffusion model learns to reverse a corruption process: if you add noise to an image iteratively, the reverse (denoising) generates a new image. Generative language models (LLMs) predict the next token autoregressively, one at a time, until reaching a stop token or max length.' },
      { heading: 'Practical LLM Application Patterns', body: 'Prompting: craft a prompt and let the model complete it — no weight updates, fast. Retrieval-Augmented Generation (RAG): retrieve relevant documents from a knowledge base, include them in the prompt context, and let the model answer grounded in that context — reduces hallucination and adds custom knowledge. Function/Tool Calling: the model outputs a function name and parameters, your code calls it, and you feed the result back into the model — this lets an LLM use external tools, APIs, and databases.' },
      { heading: 'Risks and Mitigations', body: 'Hallucination: a generative model confidently outputs false information because it has learned statistical correlations but has no grounding in truth. Mitigation: retrieve relevant facts first (RAG), ask the model to cite sources, or use a smaller, fine-tuned model on known-good data. Bias Amplification: if training data is biased (e.g., overrepresenting one group), the model will amplify those biases and make them seem plausible. Mitigation: audit training data for representation, test outputs across demographic groups, and fine-tune on balanced data. Prompt Injection: a user embeds hidden instructions in an input (e.g., a document to be summarized), causing the model to ignore its intended instructions. Mitigation: separate user input from system instructions, use a separate moderation pass before passing to the LLM, or use a model fine-tuned to resist prompt injection.' },
    ],
    practice: [
      'Describe one use case for each: autoencoder, GAN, diffusion model, and generative LLM.',
      'Build a simple RAG pipeline: load a document, retrieve a relevant chunk for a query, and prompt an LLM to answer based on that chunk.',
      'Design a prompt-injection defense: how would you isolate user input from system instructions in a chatbot?',
    ],
    comingUp: 'Lab 2 has you build an LLM application and deliberately probe it with an adversarial input to observe a failure mode and design a fix.',
  },
];

const AIM09_QUIZ_BANKS = [
  {
    conceptId: 'aim09-vision', conceptTitle: 'Vision & transfer learning', questions: [
      { id: 'aim09-q-vis-1', prompt: 'A convolutional layer, compared to a fully-connected layer on raw pixels, is advantageous for images MAINLY because it:', options: [
        { id: 'a', text: 'Requires no training data' },
        { id: 'b', text: 'Exploits local spatial structure and shares weights across the image, reducing parameters' },
        { id: 'c', text: 'Removes the need for labels' },
        { id: 'd', text: 'Only works on grayscale images' },
      ], correctId: 'b', feedbackCorrect: 'Correct — convolution exploits spatial locality and weight sharing, keeping parameter count tractable even for large images.', feedbackIncorrect: 'Convolutional layers exploit local spatial structure and share the same weights across positions in the image, drastically reducing the number of parameters compared to fully-connected layers on raw pixels.' },
      { id: 'aim09-q-vis-2', prompt: 'Transfer learning is most useful when:', options: [
        { id: 'a', text: 'You have millions of labeled examples for your exact task' },
        { id: 'b', text: 'You have a small dataset and can leverage features already learned by a model trained on a large, related dataset' },
        { id: 'c', text: 'You want to avoid using any pretrained weights' },
        { id: 'd', text: 'The new task has nothing in common with the pretrained task' },
      ], correctId: 'b', feedbackCorrect: 'Correct — transfer learning shines when your dataset is small but a related pretrained model is available; you reuse its learned features and train only the task-specific head.', feedbackIncorrect: 'Transfer learning is most valuable when you have limited labeled data for your task but can reuse a model trained on a large, related dataset — you retrain only the top layers instead of learning from random weights.' },
    ],
  },
  {
    conceptId: 'aim09-transformers', conceptTitle: 'Transformers & language models', questions: [
      { id: 'aim09-q-trans-1', prompt: 'Self-attention in a transformer allows the model to:', options: [
        { id: 'a', text: 'Process tokens strictly one at a time with no context' },
        { id: 'b', text: 'Weigh the relevance of every other token in the sequence when representing a given token, regardless of distance' },
        { id: 'c', text: 'Replace the need for any training data' },
        { id: 'd', text: 'Only work on images' },
      ], correctId: 'b', feedbackCorrect: 'Correct — self-attention computes relevance scores between every pair of tokens, letting distant tokens directly influence each other without losing information in a sequential pipeline.', feedbackIncorrect: 'Self-attention lets a token directly attend to every other token in the sequence by computing relevance scores; this is why transformers overcome the distance problem that plagued recurrent networks.' },
      { id: 'aim09-q-trans-2', prompt: 'Fine-tuning a pretrained language model differs from prompting it MAINLY in that fine-tuning:', options: [
        { id: 'a', text: 'Requires no data at all' },
        { id: 'b', text: 'Updates the model\'s weights on task-specific data, while prompting leaves weights unchanged and relies on instructions/context' },
        { id: 'c', text: 'Is always cheaper than prompting' },
        { id: 'd', text: 'Only applies to image models' },
      ], correctId: 'b', feedbackCorrect: 'Correct — fine-tuning modifies model weights on task data, whereas prompting leaves weights frozen and instructs the model via the prompt and context window.', feedbackIncorrect: 'Fine-tuning updates the model\'s learned weights on task-specific training data, while prompting leaves the weights unchanged and relies on the prompt and in-context examples to guide the output.' },
    ],
  },
  {
    conceptId: 'aim09-generative-ai-risk', conceptTitle: 'Generative AI risks', questions: [
      { id: 'aim09-q-risk-1', prompt: 'A generative language model confidently states an incorrect fact with no indication of uncertainty. This is an example of:', options: [
        { id: 'a', text: 'Overfitting' },
        { id: 'b', text: 'Hallucination' },
        { id: 'c', text: 'Data leakage' },
        { id: 'd', text: 'Gradient explosion' },
      ], correctId: 'b', feedbackCorrect: 'Correct — hallucination is when a generative model produces false information with confidence, mistaking learned statistical patterns for factual truth.', feedbackIncorrect: 'Hallucination is the term for a generative model confidently producing false or nonsensical output because it has learned statistical patterns without grounding in reality.' },
      { id: 'aim09-q-risk-2', prompt: 'A user embeds hidden instructions inside a document that an LLM-powered application later summarizes, causing the model to ignore its original instructions. This is an example of:', options: [
        { id: 'a', text: 'Model collapse' },
        { id: 'b', text: 'Prompt injection' },
        { id: 'c', text: 'Vanishing gradients' },
        { id: 'd', text: 'Class imbalance' },
      ], correctId: 'b', feedbackCorrect: 'Correct — prompt injection is when a user sneaks instructions into data that the model then treats as primary instructions, overriding the intended task.', feedbackIncorrect: 'Prompt injection occurs when a user embeds hidden instructions inside an input (e.g., a document to summarize), and the LLM treats those instructions as part of its task, overriding the original intent.' },
    ],
  },
];

const AIM09_BLANKS = [
  { id: 'aim09-b1', prompt: 'A ______ neural network uses filters that slide across an image to detect local patterns like edges and textures.', accept: ['convolutional'] },
  { id: 'aim09-b2', prompt: '______ learning reuses a model trained on one large task as a starting point for a new, related task.', accept: ['Transfer'] },
  { id: 'aim09-b3', prompt: 'The ______ mechanism lets a transformer weigh how relevant each token is to every other token in a sequence.', accept: ['attention', 'self-attention'] },
  { id: 'aim09-b4', prompt: 'A generative model producing plausible-sounding but false output is called ______.', accept: ['hallucination'] },
];

const AIM09_SOURCES = [
  { title: '"Attention Is All You Need" — Vaswani et al.', org: 'arXiv', url: 'https://arxiv.org/abs/1706.03762', note: 'The original transformer paper.' },
  { title: '"Deep Residual Learning for Image Recognition" (ResNet) — He et al.', org: 'arXiv', url: 'https://arxiv.org/abs/1512.03385', note: 'The CNN architecture used as the transfer-learning base in Lab 1.' },
  { title: 'Hugging Face documentation', org: 'Hugging Face', url: 'https://huggingface.co/docs', note: 'Pretrained model hub, tokenizers, and fine-tuning APIs used in Lab 2.' },
  { title: 'TensorFlow guide', org: 'TensorFlow', url: 'https://www.tensorflow.org/guide', note: 'Alternative framework reference for transfer learning if not using PyTorch.' },
  { title: 'OWASP Top 10 for LLM Applications', org: 'OWASP', url: 'https://genai.owasp.org/llm-top-10/', note: 'Risk categories referenced in the generative-AI risk topic and lab.' },
];

const AIM09_LAB_ID = 'aim09-applied-ai-v1';
const AIM09_LAB_KEY = 'lab-aim-09-applied-ai';

const AIM09_LAB_STEPS = [
  { id: 'setup', label: 'Set up a Python environment with PyTorch (or TensorFlow) and a pretrained model library (e.g., torchvision, Hugging Face).' },
  { id: 'cnn-load', label: 'Loaded a pretrained CNN (ResNet or similar) with frozen base layers.' },
  { id: 'cnn-finetune', label: 'Fine-tuned only the final classification layer(s) on a small, new image dataset.' },
  { id: 'cnn-compare', label: 'Compared training time and accuracy: frozen base vs. end-to-end retraining from random weights.' },
  { id: 'llm-build', label: 'Built a small LLM application (classification, Q&A, or retrieval) using a pretrained language model via API or local inference.' },
  { id: 'llm-adversarial', label: 'Probed the LLM feature with an adversarial input (ambiguous, injection attempt, or edge case) and documented the failure mode and one mitigation.' },
];

const AIM09_DEFAULT_STATE = {
  stepsDone: {}, reflection: '', reflectionChecked: false,
  reviewMode: false,
  blankAnswers: {}, blankResults: {},
  repoUrl: '', demoUrl: '', repoUrlTouched: false,
};

/* Real-product deliverable, per AI_ML_APPLIED_BUILD_TRACK.md (Model B —
 * student's own GitHub, one small repo per project module). */
function aim09IsValidUrl(value) {
  return /^https?:\/\/.+\..+/.test((value || '').trim());
}

function aim09LabComplete() {
  const allDone = AIM09_LAB_STEPS.every((step) => aim09State.stepsDone[step.id]);
  const reflectionOk = aim09State.reflection.trim().length >= 40;
  const repoOk = aim09IsValidUrl(aim09State.repoUrl);
  return allDone && reflectionOk && repoOk;
}

let aim09State = null;
let aim09User = null;
let aim09QuizState = null;

function aim09Load(user) {
  aim09User = user;
  aim09State = LabRuntime.load(AIM09_LAB_ID, user, AIM09_DEFAULT_STATE);
  if (!aim09State.stepsDone || typeof aim09State.stepsDone !== 'object') aim09State.stepsDone = {};
  if (!aim09State.blankAnswers) aim09State.blankAnswers = {};
  if (!aim09State.blankResults) aim09State.blankResults = {};

  if (!aim09QuizState) {
    const previousQuestionIds = aim09State.lastQuizQuestionIds || [];
    const selection = selectQuizQuestions(AIM09_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
    aim09QuizState = {
      selectedQuestions: selection.selectedQuestions,
      questionsByAnswer: selection.questionsByAnswer,
      answers: {}, scored: false, attempts: 0, score: 0, bestScore: 0, feedback: [], passed: false,
    };
  }

  if (typeof markModuleContentOpened === 'function') markModuleContentOpened(user, 'ai-ml', 'aim-09');
  return aim09State;
}

function aim09Save() {
  if (aim09User && aim09State) LabRuntime.save(AIM09_LAB_ID, aim09User, aim09State);
}

/* -------------------------------------------------------------- lessons */

function aim09LessonCard(lesson) {
  return `<details class="aim-lesson" data-aim09-lesson="${esc(lesson.id)}" ${aim09State.reviewMode ? 'open' : ''}>
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

function aim09BlankItem(blank) {
  const value = aim09State.blankAnswers[blank.id] || '';
  const result = aim09State.blankResults[blank.id];
  const statusClass = result === true ? 'is-correct' : result === false ? 'is-incorrect' : '';
  return `<li class="aim-blank-item ${statusClass}" data-aim09-blank="${esc(blank.id)}">
    <p class="aim-blank-prompt">${esc(blank.prompt)}</p>
    <div class="aim-blank-row">
      <input type="text" value="${esc(value)}" data-aim09-blank-input="${esc(blank.id)}" aria-label="Your answer" autocomplete="off" />
      <button type="button" class="aim-blank-check" data-aim09-blank-check="${esc(blank.id)}">Check</button>
    </div>
    ${result === true ? '<p class="aim-blank-result">Correct.</p>' : ''}
    ${result === false ? `<p class="aim-blank-result">Not quite — expected: ${esc(blank.accept[0])}</p>` : ''}
  </li>`;
}

function aim09BlankDrill() {
  return `<ul class="aim-blank-list">${AIM09_BLANKS.map(aim09BlankItem).join('')}</ul>`;
}

/* -------------------------------------------------------------- quiz */

function aim09QuizQuestion(selected, index) {
  const question = selected.question;
  const userAnswerId = aim09QuizState?.answers?.[question.id];
  return `<fieldset class="aim-quiz-question" data-question-id="${esc(question.id)}">
    <legend><span>${index + 1}</span> ${esc(selected.conceptTitle)}: ${esc(question.prompt)}</legend>
    <div class="aim-quiz-options">
      ${selected.shuffledOptions.map((option) => `<label>
        <input type="radio" name="q-${esc(question.id)}" value="${esc(option.id)}" ${userAnswerId === option.id ? 'checked' : ''} data-aim09-quiz-answer />
        <span>${esc(option.text)}</span>
      </label>`).join('')}
    </div>
  </fieldset>`;
}

function aim09QuizPanel() {
  if (!aim09QuizState?.selectedQuestions || aim09QuizState.selectedQuestions.length === 0) {
    return `<div class="aim-quiz-empty" id="aim09-quiz-feedback" role="status">Loading quiz…</div>`;
  }
  const selected = aim09QuizState.selectedQuestions;
  const answered = Object.keys(aim09QuizState.answers || {}).length;
  const total = selected.length;

  let feedbackHtml = '';
  if (aim09QuizState.scored) {
    const passed = aim09QuizState.score >= 70;
    feedbackHtml = `<section class="aim-quiz-score ${passed ? 'aim-quiz-pass' : 'aim-quiz-remediate'}" id="aim09-quiz-feedback" tabindex="-1" aria-live="polite">
      <div class="aim-quiz-score-heading">
        <div><p class="aim-kicker">Attempt ${aim09QuizState.attempts} · best ${aim09QuizState.bestScore}/100</p><h3>${aim09QuizState.score}/100 — ${passed ? 'Knowledge check passed' : 'Review and retry'}</h3></div>
        <span>${aim09QuizState.score}</span>
      </div>
      <ul class="aim-quiz-feedback-list">${(aim09QuizState.feedback || []).map((fb) => `<li>
        <i class="ri-${fb.correct ? 'checkbox-circle-fill' : 'information-line'}" aria-hidden="true"></i>
        <div><strong>${fb.correct ? 'Correct' : 'Review'}</strong><p>${esc(fb.message)}</p></div>
      </li>`).join('')}</ul>
      ${!passed ? `<div class="aim-quiz-actions"><button type="button" class="aim-quiz-retry" data-aim09-quiz-retry><i class="ri-refresh-line" aria-hidden="true"></i> Try different questions</button></div>` : ''}
    </section>`;
  } else if (answered === total) {
    feedbackHtml = `<div class="aim-quiz-ready" id="aim09-quiz-feedback" role="status">All questions answered. Submit to check your responses.</div>`;
  } else {
    feedbackHtml = `<div class="aim-quiz-empty" id="aim09-quiz-feedback" role="status">Answer all ${total} questions to submit.</div>`;
  }

  return `<form class="aim-quiz-form" id="aim09-quiz-form" novalidate>
    <div class="aim-panel-heading"><div><p class="aim-kicker">Knowledge check</p><h3>Test your understanding of applied AI and generative models</h3></div><span>${answered}/${total} answered</span></div>
    ${selected.map((sel, idx) => aim09QuizQuestion(sel, idx)).join('')}
    <div class="aim-quiz-actions">
      <button class="aim-quiz-submit" type="submit" ${answered < total ? 'disabled' : ''}><i class="ri-checkbox-circle-line" aria-hidden="true"></i> Check my answers</button>
    </div>
    ${feedbackHtml}
  </form>`;
}

/* -------------------------------------------------------------- lab */

function aim09LabStepItem(step) {
  const done = Boolean(aim09State.stepsDone[step.id]);
  return `<li class="aim-lab-step ${done ? 'is-done' : ''}"><input type="checkbox" id="aim09-step-${esc(step.id)}" data-aim09-step="${esc(step.id)}" ${done ? 'checked' : ''} /><label for="aim09-step-${esc(step.id)}"><span>${esc(step.label)}</span></label></li>`;
}

function aim09LabStatus() {
  const complete = aim09LabComplete();
  return `<div class="aim-lab-status ${complete ? 'aim-status-pass' : 'aim-status-pending'}"><i class="${complete ? 'ri-checkbox-circle-fill' : 'ri-time-line'}" aria-hidden="true"></i><span>${complete ? 'Lab complete — every step is checked, your reflection is recorded, and your repository URL is saved.' : 'Check off every step in your own Python environment, record a short reflection, and paste your repository URL.'}</span></div>`;
}

function aim09RepoFields() {
  const repoInvalid = aim09State.repoUrlTouched && aim09State.repoUrl.trim() && !aim09IsValidUrl(aim09State.repoUrl);
  return `<div class="aim-repo-fields">
    <div class="aim-repo-field">
      <label for="aim09-repo-url">Repository URL (required)</label>
      <input type="url" id="aim09-repo-url" data-aim09-repo-url value="${esc(aim09State.repoUrl)}" placeholder="https://github.com/your-username/aiml-09-applied-ai" ${repoInvalid ? 'class="is-invalid"' : ''} />
      ${repoInvalid ? '<small class="aim-repo-error">That doesn\'t look like a full URL (e.g. https://github.com/you/repo).</small>' : '<small>Push your transfer-learning notebook and LLM mini-project to a public or private repo (your own GitHub account) and paste the URL here.</small>'}
    </div>
    <div class="aim-repo-field">
      <label for="aim09-demo-url">Live demo / recording URL (optional)</label>
      <input type="url" id="aim09-demo-url" data-aim09-demo-url value="${esc(aim09State.demoUrl)}" placeholder="https://..." />
      <small>Optional — a hosted demo of the LLM feature or a short recording of it running.</small>
    </div>
  </div>`;
}

function aim09LabPanel() {
  return `
    <ol class="aim-lab-steps">${AIM09_LAB_STEPS.map(aim09LabStepItem).join('')}</ol>
    <div class="aim-reflection">
      <label for="aim09-reflection">Describe the failure mode you observed when you probed your LLM feature with an adversarial input, and the one mitigation you'd apply.</label>
      <textarea id="aim09-reflection" data-aim09-reflection rows="4">${esc(aim09State.reflection)}</textarea>
      <small>Write at least a couple of sentences — this is your evidence that the lab was actually completed.</small>
    </div>
    ${aim09RepoFields()}
    ${aim09LabStatus()}
  `;
}

/* -------------------------------------------------------------- shell */

function aim09Sections() {
  const labComplete = aim09LabComplete();
  return [
    { id: 'aim09-lessons', title: 'Foundations', type: 'lecture', isComplete: true, scrollId: 'aim09-lessons' },
    { id: 'aim09-knowledge-check', title: 'Knowledge Check', type: 'quiz', isComplete: Boolean(aim09QuizState?.passed), scrollId: 'aim09-knowledge-check' },
    { id: 'aim09-lab', title: 'Hands-On Lab', type: 'lab', isComplete: labComplete, scrollId: 'aim09-lab' },
  ];
}

function viewAiMlModuleNine(user, program) {
  aim09Load(user);
  const module = program.modules['aim-09'];

  return `<div class="aim-shell">
    ${moduleTopbar(user, program)}
    ${moduleProgressShell(aim09Sections(), { reviewMode: aim09State.reviewMode })}
    <main class="aim-main">
      <section class="aim-hero" aria-labelledby="aim09-title">
        <div>
          <p class="aim-kicker">Module 09 · ${formatInstructionalMinutes(module.durationMinutes)} · Week 5</p>
          <h1 id="aim09-title">${esc(module.title)}</h1>
          <p class="aim-lede">${esc(module.summary)}</p>
        </div>
        <dl class="aim-progress" aria-label="Saved module progress">
          <div><dt>Lessons</dt><dd>${module.lessons}</dd></div>
          <div><dt>Hands-on labs</dt><dd>${module.labs}</dd></div>
        </dl>
      </section>

      <section class="aim-objective" aria-labelledby="aim09-objective-title"><span><i class="ri-focus-2-line" aria-hidden="true"></i></span><div><p class="aim-kicker">One measurable objective</p><h2 id="aim09-objective-title">Apply deep learning to computer vision and language using pretrained models, and identify the main risks generative models introduce.</h2></div></section>

      <details class="aim-section-collapsible" id="aim09-lessons" ${aim09State.reviewMode ? 'open' : 'open'}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>1</span><div><p class="aim-kicker">Learn</p><h2>Five applied AI lessons</h2></div></div></summary>
        <div class="aim-section-body">
          <p class="aim-instruction">Open each lesson for the full walkthrough, then work its Try It Yourself exercise in your own Python environment.</p>
          <div class="aim-lesson-grid">${AIM09_LESSONS.map(aim09LessonCard).join('')}</div>
        </div>
      </details>

      <details class="aim-section-collapsible" id="aim09-blanks" ${aim09State.reviewMode ? 'open' : ''}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>2</span><div><p class="aim-kicker">Vocabulary drill</p><h2>Fill in the blank</h2></div></div></summary>
        <div class="aim-section-body">${aim09BlankDrill()}</div>
      </details>

      <details class="aim-section-collapsible" id="aim09-knowledge-check" ${aim09State.reviewMode || (aim09QuizState && !aim09QuizState.passed) ? 'open' : ''}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>3</span><div><p class="aim-kicker">Interactive knowledge check</p><h2>Test your understanding</h2></div></div></summary>
        <div class="aim-section-body"><div id="aim09-quiz-dynamic">${aim09QuizPanel()}</div></div>
      </details>

      <details class="aim-section-collapsible" id="aim09-lab" ${aim09State.reviewMode ? 'open' : 'open'}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>4</span><div><p class="aim-kicker">Hands-on · your own environment</p><h2>Transfer Learning & LLM Application Lab</h2></div></div></summary>
        <div class="aim-section-body">
          <p class="aim-instruction">Work both labs in your own Python environment: fine-tune a pretrained CNN on a new image dataset, then build an LLM application and probe it with an adversarial input. Check off each step below as you complete it.</p>
          <div id="aim09-lab-dynamic">${aim09LabPanel()}</div>
        </div>
      </details>

      <details class="aim-section-collapsible" id="aim09-sources" ${aim09State.reviewMode ? 'open' : ''}>
        <summary class="aim-section-summary"><div class="aim-section-heading"><span>5</span><div><p class="aim-kicker">Supporting resources</p><h2>Further reading</h2></div></div></summary>
        <div class="aim-section-body">${moduleSourcesBlock(AIM09_SOURCES)}</div>
      </details>
    </main>
  </div>`;
}

/* -------------------------------------------------------------- render helpers */

function aim09RenderQuiz(focusId) {
  const el = document.getElementById('aim09-quiz-dynamic');
  if (!el) return;
  el.innerHTML = aim09QuizPanel();
  if (focusId) requestAnimationFrame(() => document.getElementById(focusId)?.focus());
}

function aim09RenderLab() {
  const el = document.getElementById('aim09-lab-dynamic');
  if (!el) return;
  el.innerHTML = aim09LabPanel();
}

function aim09CheckLabComplete(wasComplete) {
  const nowComplete = aim09LabComplete();
  if (nowComplete && !wasComplete) {
    if (typeof recordLabAttempt === 'function') recordLabAttempt(aim09User, AIM09_LAB_KEY, { state: 'complete', score: 100, result: { steps: AIM09_LAB_STEPS.length, repoUrl: aim09State.repoUrl, demoUrl: aim09State.demoUrl || null } });
    if (typeof markModuleLabComplete === 'function') markModuleLabComplete(aim09User, 'ai-ml', 'aim-09', AIM09_LAB_KEY);
  }
  return nowComplete;
}

/* -------------------------------------------------------------- wiring */

function wireAiMlModuleNine() {
  const shell = document.querySelector('.aim-shell');
  if (!shell || !aim09State) return;

  shell.addEventListener('click', (event) => {
    if (event.target.closest('[data-mnav-review-toggle]')) {
      aim09State.reviewMode = !aim09State.reviewMode;
      aim09Save();
      render();
      return;
    }
    const blankCheck = event.target.closest('[data-aim09-blank-check]');
    if (blankCheck) {
      const id = blankCheck.dataset.aim09BlankCheck;
      const blank = AIM09_BLANKS.find((b) => b.id === id);
      const input = shell.querySelector(`[data-aim09-blank-input="${id}"]`);
      const given = (input?.value || '').trim().toLowerCase();
      aim09State.blankResults[id] = blank.accept.some((accepted) => accepted.toLowerCase() === given);
      aim09Save();
      const item = shell.querySelector(`[data-aim09-blank="${id}"]`);
      if (item) item.outerHTML = aim09BlankItem(blank);
      return;
    }
    const retry = event.target.closest('[data-aim09-quiz-retry]');
    if (retry) {
      const previousQuestionIds = aim09QuizState.selectedQuestions.map((s) => s.question.id);
      const selection = selectQuizQuestions(AIM09_QUIZ_BANKS, { previousQuestionIds, shuffleOptions: true });
      aim09QuizState = { selectedQuestions: selection.selectedQuestions, questionsByAnswer: selection.questionsByAnswer, answers: {}, scored: false, attempts: aim09QuizState.attempts, score: 0, bestScore: aim09QuizState.bestScore, feedback: [], passed: false };
      aim09State.lastQuizQuestionIds = previousQuestionIds;
      aim09Save();
      aim09RenderQuiz('aim09-quiz-title');
    }
  });

  shell.addEventListener('input', (event) => {
    if (event.target.matches('[data-aim09-blank-input]')) {
      const id = event.target.dataset.aim09BlankInput;
      aim09State.blankAnswers[id] = event.target.value;
      aim09Save();
      return;
    }
    if (event.target.matches('[data-aim09-reflection]')) {
      const wasComplete = aim09LabComplete();
      aim09State.reflection = event.target.value;
      aim09CheckLabComplete(wasComplete);
      aim09Save();
      return;
    }
    if (event.target.matches('[data-aim09-repo-url]')) {
      const wasComplete = aim09LabComplete();
      aim09State.repoUrl = event.target.value;
      aim09CheckLabComplete(wasComplete);
      aim09Save();
      return;
    }
    if (event.target.matches('[data-aim09-demo-url]')) {
      aim09State.demoUrl = event.target.value;
      aim09Save();
    }
  });

  shell.addEventListener('blur', (event) => {
    if (!event.target.matches('[data-aim09-repo-url]')) return;
    aim09State.repoUrlTouched = true;
    aim09Save();
    aim09RenderLab();
  }, true);

  shell.addEventListener('change', (event) => {
    if (event.target.matches('[data-aim09-step]')) {
      const wasComplete = aim09LabComplete();
      const id = event.target.dataset.aim09Step;
      aim09State.stepsDone[id] = event.target.checked;
      aim09CheckLabComplete(wasComplete);
      aim09Save();
      aim09RenderLab();
      return;
    }
    if (event.target.matches('[data-aim09-quiz-answer]')) {
      const questionId = event.target.closest('[data-question-id]')?.dataset.questionId;
      if (questionId) {
        aim09QuizState.answers[questionId] = event.target.value;
        aim09State.lastQuizQuestionIds = aim09QuizState.selectedQuestions.map((s) => s.question.id);
        aim09Save();
        aim09RenderQuiz();
      }
    }
  });

  shell.addEventListener('submit', (event) => {
    if (event.target.id !== 'aim09-quiz-form') return;
    event.preventDefault();
    const result = scoreQuizAttempt(aim09QuizState.selectedQuestions, aim09QuizState.questionsByAnswer, aim09QuizState.answers);
    aim09QuizState.attempts += 1;
    aim09QuizState.score = result.score;
    aim09QuizState.bestScore = Math.max(aim09QuizState.bestScore || 0, result.score);
    aim09QuizState.feedback = result.feedback;
    aim09QuizState.passed = result.score >= 70;
    aim09QuizState.scored = true;
    if (typeof recordLabAttempt === 'function') {
      recordLabAttempt(aim09User, 'aim-09-knowledge-check', { state: aim09QuizState.passed ? 'complete' : 'in_progress', score: result.score });
    }
    aim09Save();
    aim09RenderQuiz('aim09-quiz-feedback');
  });
}

registerModuleLab({
  program: 'ai-ml',
  moduleNumber: 9,
  moduleKey: 'aim-09',
  view: viewAiMlModuleNine,
  wire: wireAiMlModuleNine,
});
