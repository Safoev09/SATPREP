// The official SAT Math reference information shown during the real test.
// Rendered in a panel students can open during Math drills.

export type ReferenceItem = {
  label: string;
  latex: string;
};

export const MATH_REFERENCE: ReferenceItem[] = [
  { label: "Area of a circle", latex: "A = \\pi r^2" },
  { label: "Circumference of a circle", latex: "C = 2\\pi r" },
  { label: "Area of a rectangle", latex: "A = \\ell w" },
  { label: "Area of a triangle", latex: "A = \\tfrac{1}{2} b h" },
  { label: "Pythagorean theorem", latex: "c^2 = a^2 + b^2" },
  { label: "Volume of a rectangular box", latex: "V = \\ell w h" },
  { label: "Volume of a cylinder", latex: "V = \\pi r^2 h" },
  { label: "Volume of a sphere", latex: "V = \\tfrac{4}{3}\\pi r^3" },
  { label: "Volume of a cone", latex: "V = \\tfrac{1}{3}\\pi r^2 h" },
  { label: "Volume of a pyramid", latex: "V = \\tfrac{1}{3} \\ell w h" },
];

export const MATH_REFERENCE_FACTS: string[] = [
  "The number of degrees of arc in a circle is 360.",
  "The number of radians of arc in a circle is 2π.",
  "The sum of the measures in degrees of the angles of a triangle is 180.",
  "Special right triangles: 30-60-90 sides are x, x√3, 2x. 45-45-90 sides are s, s, s√2.",
];
