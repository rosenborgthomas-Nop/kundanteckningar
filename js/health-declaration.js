/** Frågor från Marias hälsodeklaration (utan kontaktfält, påstående och signering). */

export const HEALTH_QUESTIONS = [
  {
    id: "hjarta",
    label: "Hjärt- eller kärlsjukdomar",
    type: "yesno",
  },
  {
    id: "blodtryck",
    label: "Blodtryck",
    type: "choice",
    options: [
      { value: "hogt", label: "Högt" },
      { value: "lagt", label: "Lågt" },
      { value: "normalt", label: "Normalt" },
    ],
  },
  {
    id: "svullnader",
    label: "Svullnader i kroppen",
    type: "yesno",
  },
  {
    id: "kramper",
    label: "Kramper, stickningar, domningar",
    type: "yesno",
  },
  {
    id: "reumatism",
    label: "Reumatism, ledbesvär, fibromyalgi m.m.",
    type: "yesno",
  },
  {
    id: "magbesvar",
    label: "Magbesvär",
    type: "yesno",
  },
  {
    id: "astma",
    label: "Astma och allergi",
    type: "yesno",
  },
  {
    id: "diabetes",
    label: "Diabetes",
    type: "yesno",
  },
  {
    id: "skelett",
    label: "Skelettskador, frakturer",
    type: "yesno",
  },
  {
    id: "annanSjukdom",
    label: "Annan sjukdom (cancer, epilepsi m.m.)",
    type: "yesno",
  },
  {
    id: "implantat",
    label: "Spiral, protes, pacemaker m.m.",
    type: "yesno",
  },
  {
    id: "gravid",
    label: "Gravid?",
    type: "yesno_detail",
    detailId: "gravidManad",
    detailLabel: "Vilken månad?",
    detailWhen: "ja",
  },
  {
    id: "behandling",
    label: "Pågående behandling",
    type: "yesno",
  },
  {
    id: "medicin",
    label: "Regelbunden medicin",
    type: "textarea",
    rows: 10,
    placeholder: "Sort och för vad",
  },
  {
    id: "cortison",
    label: "Cortisoninjektioner eller tabletter",
    type: "yesno",
  },
  {
    id: "forkyld",
    label: "Förkyld eller feber just nu",
    type: "yesno",
  },
  {
    id: "huvudvark",
    label: "Huvudvärk eller migrän",
    type: "yesno_detail",
    detailId: "huvudvarkHurOfta",
    detailLabel: "Hur ofta?",
    detailWhen: "ja",
  },
  {
    id: "annat",
    label: "Annat att tillägga",
    type: "textarea",
    rows: 10,
    placeholder: "Valfritt",
  },
];

export function emptyHealthAnswers() {
  const answers = {};
  for (const q of HEALTH_QUESTIONS) {
    answers[q.id] = "";
    if (q.detailId) answers[q.detailId] = "";
  }
  return answers;
}

export function normalizeHealthDeclaration(data) {
  if (!data || typeof data !== "object") return null;
  if (!data.updatedAt) return null;

  const answers = emptyHealthAnswers();
  const incoming = data.answers && typeof data.answers === "object" ? data.answers : {};
  for (const key of Object.keys(answers)) {
    answers[key] = typeof incoming[key] === "string" ? incoming[key] : "";
  }

  return {
    updatedAt: data.updatedAt,
    answers,
    comment: typeof data.comment === "string" ? data.comment : "",
  };
}

export function hasHealthDeclaration(patient) {
  return Boolean(normalizeHealthDeclaration(patient?.healthDeclaration));
}

export function formatAnswerLabel(question, answers) {
  const raw = (answers[question.id] || "").trim();
  if (!raw) return "—";

  if (question.type === "choice") {
    const opt = (question.options || []).find((o) => o.value === raw);
    return opt ? opt.label : raw;
  }

  if (question.type === "yesno" || question.type === "yesno_detail") {
    const base = raw === "ja" ? "Ja" : raw === "nej" ? "Nej" : raw;
    if (question.type === "yesno_detail" && raw === question.detailWhen) {
      const detail = (answers[question.detailId] || "").trim();
      if (detail) return base + " — " + detail;
    }
    return base;
  }

  return raw;
}
