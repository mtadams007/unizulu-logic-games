import type { ComponentType } from "react";

export interface GameDefinition {
  id: string;
  name: string;
  description: string;
  Component: ComponentType;
}
