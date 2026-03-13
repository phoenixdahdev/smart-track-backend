export interface ValidationError {
  code: string;
  field?: string;
  message: string;
  blocking: boolean;
}

export interface ValidationWarning {
  code: string;
  field?: string;
  message: string;
}

export interface ClaimValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}
