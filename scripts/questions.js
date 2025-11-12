export const baseQuestions = [
  {
    id: "memory",
    prompt: "a feeling, color, image that stayed?",
    helper: "",
    multiline: false,
    placeholder: "whatever comes first to mind.....",
  },
  {
    id: "similarities",
    prompt: "did it remind you of something?",
    helper: "",
    multiline: false,
    placeholder: "i felt this way when.....",
  },
  {
    id: "additional",
    prompt: "anything you want to add?",
    helper: "",
    multiline: false,
    placeholder: ".....",
  },
  {
    id: "stayConnected",
    prompt: "would you like to stay connected?",
    helper: "",
    type: "choice",
    options: [
      { value: "yes", label: "yes" },
      { value: "no", label: "no" },
    ],
  },
  {
    id: "email",
    prompt: "what is your email?",
    helper: "",
    multiline: false,
    placeholder: "name@example.com",
    showIf: (answers) => answers.stayConnected === "yes",
  },
];

export const followUpQuestions = [
  {
    id: "wantMore",
    prompt: "do you want more?",
    helper: "",
    type: "choice",
    options: [
      { value: "yes", label: "yes" },
      { value: "no", label: "no" },
    ],
  },
  {
    id: "wantMoreDetail",
    prompt: "what is it that you want?",
    helper: "",
    multiline: true,
    placeholder: "tell us more...",
    showIf: (answers) => answers.wantMore === "yes",
  },
];

export const questions = [...baseQuestions, ...followUpQuestions];


