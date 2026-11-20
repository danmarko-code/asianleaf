export type PaymentFormState = {
  error?: string;
  fieldErrors?: {
    amount?: string;
    method?: string;
    referenceNumber?: string;
    receipt?: string;
  };
  // Echoed back so a failed submission does not wipe the form.
  values?: { amount: string; method: string; referenceNumber: string };
};

export const initialPaymentState: PaymentFormState = {};
