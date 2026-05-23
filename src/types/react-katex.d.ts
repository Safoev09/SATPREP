// react-katex does not ship TypeScript types — declare them here.
declare module "react-katex" {
  import * as React from "react";

  interface MathProps {
    math: string;
    errorColor?: string;
    renderError?: (error: Error) => React.ReactNode;
    settings?: Record<string, unknown>;
    as?: string | React.ComponentType;
  }

  export const InlineMath: React.FC<MathProps>;
  export const BlockMath: React.FC<MathProps>;
}
