export type ViolationFormState = {
  error?: string;
  fieldErrors?: { category?: string };
};

export const initialViolationState: ViolationFormState = {};
