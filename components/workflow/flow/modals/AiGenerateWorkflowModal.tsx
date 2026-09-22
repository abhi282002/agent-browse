"use client";

import React from "react";
import {
  AiGenerateWorkflowSheet,
  type AiGenerateWorkflowSheetProps,
} from "./AiGenerateWorkflowSheet";

export type AiGenerateWorkflowModalProps = AiGenerateWorkflowSheetProps;

/**
 * AiGenerateWorkflowModal delegates to the left-side AiGenerateWorkflowSheet
 * providing seamless backward compatibility and responsive sheet navigation.
 */
export function AiGenerateWorkflowModal(props: AiGenerateWorkflowModalProps) {
  return <AiGenerateWorkflowSheet {...props} />;
}
