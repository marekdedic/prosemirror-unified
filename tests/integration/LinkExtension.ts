import type { Node as UnistNode } from "unist";

import type { UnistText } from "./TextExtension";

export interface UnistLink extends UnistNode {
  children: Array<UnistText>;
  type: "link";
}
