import { questions } from "./questions.js";
import { APP_CONFIG } from "./config.js";

const introScreen = document.getElementById("intro-screen");
const formScreen = document.getElementById("form-screen");
const loadingScreen = document.getElementById("loading-screen");
const endingScreen = document.getElementById("ending-screen");
const startButton = document.getElementById("start-button");
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
  nextButton.addEventListener("click", handleNext);

  nextButton.setAttribute("aria-label", "Next question");
  displayStatus("", "neutral");
  showScreen(introScreen);
}

function getVisibleQuestions() {
  return questions.filter((question) => {
    if (typeof question.showIf === "function") {
      try {
        return Boolean(question.showIf(state.answers));
      } catch (error) {
        console.warn("showIf evaluation failed", question.id, error);
        return false;
      }
    }
    return true;
  });
}

function clearHiddenAnswers() {
  questions.forEach((question) => {
    if (typeof question.showIf === "function" && !question.showIf(state.answers)) {
      delete state.answers[question.id];
    }
  });
}

function ensureIndexInRange() {
  const visible = getVisibleQuestions();
  if (visible.length === 0) {
    state.currentIndex = 0;
    return;
  }

  if (state.currentIndex >= visible.length) {
    state.currentIndex = visible.length - 1;
  }
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
  ensureIndexInRange();
  renderStep();
  updateNextButtonLabel();
}

function renderStep() {
  clearHiddenAnswers();
  const visibleQuestions = getVisibleQuestions();
  if (visibleQuestions.length === 0) return;

  ensureIndexInRange();
  const question = visibleQuestions[state.currentIndex];
  if (!question) return;

  const existingValue = state.answers[question.id] ?? "";
  const inputId = `input-${question.id}`;

  const wrapper = document.createElement("div");
  wrapper.className = "step";

  const promptEl = document.createElement("h2");
  promptEl.className = "step__prompt";
  promptEl.textContent = question.prompt;
  wrapper.appendChild(promptEl);

  if (question.helper) {
    const helperEl = document.createElement("p");
    helperEl.className = "step__helper";
    helperEl.textContent = question.helper;
    wrapper.appendChild(helperEl);
  }

  let focusTarget = null;

  if (question.type === "choice") {
    const optionsContainer = document.createElement("div");
    optionsContainer.className = "choice";
    optionsContainer.setAttribute("role", "radiogroup");

    question.options.forEach((option) => {
      const optionButton = document.createElement("button");
      optionButton.type = "button";
      optionButton.className = "choice__option";
      optionButton.dataset.value = option.value;
      optionButton.textContent = option.label;

      if (existingValue === option.value) {
        optionButton.classList.add("choice__option--selected");
        optionButton.setAttribute("aria-pressed", "true");
      } else {
        optionButton.setAttribute("aria-pressed", "false");
      }

      optionButton.addEventListener("click", () => {
        state.answers[question.id] = option.value;
        markChoiceSelection(optionsContainer, option.value);
        clearHiddenAnswers();
        ensureIndexInRange();
        updateNextButtonLabel();
      });

      optionsContainer.appendChild(optionButton);
    });

    wrapper.appendChild(optionsContainer);
    const selected = optionsContainer.querySelector(".choice__option--selected");
    focusTarget = selected || optionsContainer.querySelector(".choice__option");
  } else {
    const inputEl = question.multiline
      ? document.createElement("textarea")
      : document.createElement("input");

    if (!question.multiline) {
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

    wrapper.appendChild(inputEl);
    focusTarget = inputEl;
  }

  swapContent(wrapper);

  window.requestAnimationFrame(() => {
    setTimeout(() => {
      if (!focusTarget) return;
      focusTarget.focus();
      if (focusTarget.setSelectionRange && focusTarget.value) {
        const length = focusTarget.value.length;
        focusTarget.setSelectionRange(length, length);
      }
    }, APP_CONFIG.transitionDuration);
  });
}

function markChoiceSelection(container, value) {
  container.querySelectorAll(".choice__option").forEach((button) => {
    const isSelected = button.dataset.value === value;
    button.classList.toggle("choice__option--selected", isSelected);
    button.setAttribute("aria-pressed", isSelected ? "true" : "false");
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

  clearHiddenAnswers();
  const visible = getVisibleQuestions();

  if (visible.length === 0) {
    submitAnswers();
    return;
  }

  if (state.currentIndex >= visible.length - 1) {
    submitAnswers();
    return;
  }

  state.currentIndex += 1;
  renderStep();
  updateNextButtonLabel();
}

function updateNextButtonLabel() {
  const visible = getVisibleQuestions();
  if (visible.length === 0) {
    nextButton.setAttribute("aria-label", "Submit responses");
    return;
  }

  if (state.currentIndex >= visible.length - 1) {
    nextButton.setAttribute("aria-label", "Submit responses");
  } else {
    nextButton.setAttribute("aria-label", "Next question");
  }
}

function submitAnswers() {
  clearHiddenAnswers();
  const visible = getVisibleQuestions();
  const payload = {
    submittedAt: new Date().toISOString(),
    answers: visible.map((question) => ({
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


