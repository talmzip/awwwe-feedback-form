import { questions } from "./questions.js";
import { APP_CONFIG } from "./config.js";

const stepContentEl = document.getElementById("step-content");
const backButton = document.getElementById("back-button");
const nextButton = document.getElementById("next-button");
const statusMessageEl = document.getElementById("status-message");

const state = {
  currentIndex: 0,
  answers: {},
  isTransitioning: false,
  hasSubmitted: false,
};

function init() {
  document.documentElement.style.setProperty(
    "--transition-duration",
    `${APP_CONFIG.transitionDuration}ms`
  );
  document.documentElement.style.setProperty(
    "--transition-ease",
    APP_CONFIG.transitionEase
  );

  backButton.addEventListener("click", handleBack);
  nextButton.addEventListener("click", handleNext);

  displayStatus("", "neutral");
  renderStep();
  updateNavButtons();
}

function renderStep() {
  const question = questions[state.currentIndex];
  if (!question) return;

  const existingValue = state.answers[question.id] || "";
  const inputId = `input-${question.id}`;

  const wrapper = document.createElement("div");
  wrapper.className = "step";

  const promptEl = document.createElement("h2");
  promptEl.className = "step__prompt";
  promptEl.textContent = question.prompt;

  const helperEl = document.createElement("p");
  helperEl.className = "step__helper";
  helperEl.textContent = question.helper;

  let inputEl;
  if (question.multiline) {
    inputEl = document.createElement("textarea");
    inputEl.rows = 5;
  } else {
    inputEl = document.createElement("input");
    inputEl.type = "text";
  }

  inputEl.id = inputId;
  inputEl.name = question.id;
  inputEl.className = "step__input";
  inputEl.placeholder = question.placeholder;
  inputEl.value = existingValue;
  inputEl.addEventListener("input", (event) => {
    state.answers[question.id] = event.target.value;
  });

  wrapper.append(promptEl, helperEl, inputEl);
  swapContent(wrapper);

  // Move focus after transition for accessibility
  window.requestAnimationFrame(() => {
    setTimeout(() => {
      inputEl.focus();
      inputEl.setSelectionRange(inputEl.value.length, inputEl.value.length);
    }, APP_CONFIG.transitionDuration);
  });
}

function swapContent(newContent) {
  if (state.isTransitioning) return;
  state.isTransitioning = true;

  const previous = stepContentEl.firstElementChild;
  if (previous) {
    previous.classList.add("step--fade-out");
  }

  const handleTransitionEnd = () => {
    if (previous) {
      stepContentEl.removeChild(previous);
    }
    newContent.classList.add("step--fade-in");
    stepContentEl.appendChild(newContent);
    state.isTransitioning = false;
  };

  if (previous) {
    previous.addEventListener("animationend", handleTransitionEnd, {
      once: true,
    });
  } else {
    handleTransitionEnd();
  }
}

function handleNext() {
  if (state.isTransitioning) return;

  if (state.currentIndex < questions.length - 1) {
    state.currentIndex += 1;
    renderStep();
    updateNavButtons();
    return;
  }

  if (state.hasSubmitted) {
    resetForm();
    return;
  }

  submitAnswers();
}

function handleBack() {
  if (state.isTransitioning) return;
  if (state.currentIndex === 0) return;

  state.currentIndex -= 1;
  renderStep();
  updateNavButtons();
}

function updateNavButtons() {
  backButton.disabled = state.currentIndex === 0 || state.isTransitioning;

  if (state.hasSubmitted) {
    nextButton.textContent = "Start over";
    nextButton.classList.add("button--secondary");
    backButton.classList.add("button--hidden");
    return;
  }

  nextButton.classList.remove("button--secondary");
  backButton.classList.remove("button--hidden");

  if (state.currentIndex === questions.length - 1) {
    nextButton.textContent = "Submit";
  } else {
    nextButton.textContent = "Next";
  }
}

function submitAnswers() {
  const payload = {
    submittedAt: new Date().toISOString(),
    answers: questions.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      value: state.answers[question.id] ?? "",
    })),
  };

  const url = APP_CONFIG.submitUrl;

  if (!url || url.includes("YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL")) {
    displayStatus(
      "Set your Google Apps Script web app URL in `scripts/config.js` to enable submissions.",
      "error"
    );
    return;
  }

  toggleButtons(true);
  displayStatus("Sending your responses...", "info");

  const formData = new URLSearchParams();
  formData.append("data", JSON.stringify(payload));

  fetch(url, {
    method: "POST",
    body: formData,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      return response.text();
    })
    .then((bodyText) => {
      let data = {};
      if (bodyText) {
        try {
          data = JSON.parse(bodyText);
        } catch (error) {
          console.warn("Unable to parse response JSON", error);
        }
      }

      if (data.status !== "ok") {
        throw new Error(data.message || "Unknown error");
      }

      displayStatus("Thanks! Your responses are on their way.", "success");
      state.hasSubmitted = true;
      toggleButtons(false);
      updateNavButtons();
    })
    .catch((error) => {
      console.error(error);
      displayStatus(
        "Something went wrong sending your responses. Please try again.",
        "error"
      );
      toggleButtons(false);
    });
}

function displayStatus(message, tone) {
  statusMessageEl.textContent = message;
  statusMessageEl.dataset.tone = tone;
}

function toggleButtons(disabled) {
  backButton.disabled = disabled || state.currentIndex === 0;
  nextButton.disabled = disabled;
}

function resetForm() {
  state.currentIndex = 0;
  state.answers = {};
  state.hasSubmitted = false;
  displayStatus("", "neutral");
  renderStep();
  updateNavButtons();
}

document.addEventListener("DOMContentLoaded", init);


