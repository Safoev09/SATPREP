// Official College Board SAT skill taxonomy

export const SKILLS = {
  reading_writing: {
    "Information & Ideas": [
      { id: "central_ideas", label: "Central Ideas & Details" },
      { id: "command_of_evidence", label: "Command of Evidence" },
      { id: "inferences", label: "Inferences" },
    ],
    "Craft & Structure": [
      { id: "words_in_context", label: "Words in Context" },
      { id: "text_structure", label: "Text Structure & Purpose" },
      { id: "cross_text", label: "Cross-Text Connections" },
    ],
    "Expression of Ideas": [
      { id: "rhetorical_synthesis", label: "Rhetorical Synthesis" },
      { id: "transitions", label: "Transitions" },
    ],
    "Standard English Conventions": [
      { id: "boundaries", label: "Boundaries" },
      { id: "form_structure_sense", label: "Form, Structure, and Sense" },
    ],
  },
  math: {
    "Algebra": [
      { id: "linear_equations_one", label: "Linear equations in 1 variable" },
      { id: "linear_equations_two", label: "Linear equations in 2 variables" },
      { id: "linear_functions", label: "Linear functions" },
      { id: "systems_linear", label: "Systems of linear equations" },
      { id: "linear_inequalities", label: "Linear inequalities" },
    ],
    "Advanced Math": [
      { id: "equivalent_expressions", label: "Equivalent expressions" },
      { id: "nonlinear_equations", label: "Nonlinear equations" },
      { id: "nonlinear_functions", label: "Nonlinear functions" },
    ],
    "Problem Solving & Data Analysis": [
      { id: "ratios_rates_proportions", label: "Ratios, rates, proportions" },
      { id: "percentages", label: "Percentages" },
      { id: "one_variable_data", label: "One-variable data" },
      { id: "two_variable_data", label: "Two-variable data, models" },
      { id: "probability", label: "Probability & conditional probability" },
      { id: "inference_stats", label: "Inference from sample statistics" },
      { id: "evaluating_claims", label: "Evaluating statistical claims" },
    ],
    "Geometry & Trigonometry": [
      { id: "area_volume", label: "Area & volume" },
      { id: "lines_angles_triangles", label: "Lines, angles, triangles" },
      { id: "right_triangles_trig", label: "Right triangles & trigonometry" },
      { id: "circles", label: "Circles" },
    ],
  },
} as const;

// A single skill entry
export type Skill = { id: string; label: string };

// Flat helper: get all skill objects for a section
export function getAllSkills(section: "reading_writing" | "math"): Skill[] {
  return Object.values(SKILLS[section]).flat() as Skill[];
}

// Flat helper: every skill across both sections
export function getAllSkillsFlat(): Skill[] {
  return [...getAllSkills("reading_writing"), ...getAllSkills("math")];
}

// Get the human-readable category (domain) for a skill id
export function getSkillDomain(skillId: string): string | null {
  for (const section of ["reading_writing", "math"] as const) {
    for (const [domain, skills] of Object.entries(SKILLS[section])) {
      if ((skills as readonly Skill[]).some((s) => s.id === skillId)) return domain;
    }
  }
  return null;
}

// Get a skill's display label
export function getSkillLabel(skillId: string): string {
  const found = getAllSkillsFlat().find((s) => s.id === skillId);
  return found?.label ?? skillId;
}

// Question type
export type Question = {
  id: number;
  source_test: string;
  source_module: string | null;
  source_question_number: number | null;
  section: "reading_writing" | "math";
  skill: string;
  difficulty: "easy" | "medium" | "hard";
  passage_id: number | null;
  prompt: string;
  prompt_latex: string | null;
  prompt_image_url: string | null;
  choice_a: string | null;
  choice_b: string | null;
  choice_c: string | null;
  choice_d: string | null;
  spr_answer: string | null;
  correct_answer: string;
  explanation: string;
  is_published: boolean;
  visibility: "free" | "premium";
  created_at: string;
};
