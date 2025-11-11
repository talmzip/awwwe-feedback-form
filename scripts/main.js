import { questions } from "./questions.js";
import { APP_CONFIG } from "./config.js";

const introScreen = document.getElementById("intro-screen");
const formScreen = document.getElementById("form-screen");
const loadingScreen = document.getElementById("loading-screen");
const endingScreen = document.getElementById("ending-screen");
const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");
const stepContentEl = document.getElementById("step-content");
const nextButton = document.getElementById("next-button");
const statusMessageEl = document.getElementById("status-message");

const SCREENS = [introScreen, formScreen, loadingScreen, endingScreen];

const state = {
  currentIndex: 0,
  answers: {},
  isTransitioning: false,
  hasStarted: false,
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

  startButton.addEventListener("click", handleStart);
  if (restartButton) {
    restartButton.addEventListener("click", resetForm);
  }
  nextButton.addEventListener("click", handleNext);

  nextButton.setAttribute("aria-label", "Next question");
  displayStatus("", "neutral");
  showScreen(introScreen);
}

function showScreen(target) {
  SCREENS.forEach((screen) => {
    if (!screen) return;
    if (screen === target) {
      screen.classList.remove("screen--hidden");
    } else {
      screen.classList.add("screen--hidden");
    }
  });
}

function handleStart() {
  if (state.hasStarted) return;
  state.hasStarted = true;
  showScreen(formScreen);
  renderStep();
  updateNextButtonLabel();
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

  if (!state.hasStarted) {
    handleStart();
    return;
  }

  if (state.currentIndex < questions.length - 1) {
    state.currentIndex += 1;
    renderStep();
    updateNextButtonLabel();
    return;
  }

  submitAnswers();
}

function updateNextButtonLabel() {
  if (state.currentIndex === questions.length - 1) {
    nextButton.setAttribute("aria-label", "Submit responses");
  } else {
    nextButton.setAttribute("aria-label", "Next question");
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
    showScreen(formScreen);
    displayStatus(
      "Set your Google Apps Script web app URL in `scripts/config.js` to enable submissions.",
      "error"
    );
    return;
  }

  toggleButtons(true);
  displayStatus("", "neutral");
  showScreen(loadingScreen);

  const formData = new URLSearchParams();
  formData.append("data", JSON.stringify(payload));

  fetch(url, {
    method: "POST",
    body: formData,
  })
    .then(async (response) => {
      const bodyText = await response.text();

      if (!response.ok) {
        throw new Error(
          `Request failed with status ${response.status}: ${bodyText}`
        );
      }

      let parsed;
      if (bodyText) {
        try {
          parsed = JSON.parse(bodyText);
        } catch (error) {
          console.warn("Unable to parse response JSON", error, bodyText);
        }
      }

      if (parsed && parsed.status && parsed.status !== "ok") {
        throw new Error(parsed.message || "Unknown error");
      }

      state.hasSubmitted = true;
      toggleButtons(false);
      showScreen(endingScreen);
    })
    .catch((error) => {
      console.error(error);
      showScreen(formScreen);
      displayStatus(
        "Something went wrong sending your responses. Please try again.",
        "error"
      );
      toggleButtons(false);
    });
}

function displayStatus(message, tone) {
  statusMessageEl.textContent = message;
  if (!message) {
    statusMessageEl.removeAttribute("data-tone");
  } else {
    statusMessageEl.dataset.tone = tone;
  }
}

function toggleButtons(disabled) {
  nextButton.disabled = disabled;
}

function resetForm() {
  state.currentIndex = 0;
  state.answers = {};
  state.hasStarted = false;
  state.hasSubmitted = false;
  state.isTransitioning = false;
  stepContentEl.innerHTML = "";
  displayStatus("", "neutral");
  showScreen(introScreen);
  updateNextButtonLabel();
}

document.addEventListener("DOMContentLoaded", init);


