import type { Processor } from "unified";
import type { Node as UnistNode } from "unist";

import { Extension } from "../../src/Extension";

type UnifiedProcessor = Processor<
  UnistNode,
  UnistNode,
  UnistNode,
  UnistNode,
  string
>;

/**
 * Supplies a real unified processor with a stub parser and compiler, so that
 * the integration tests drive the actual unified pipeline while still
 * controlling the unist tree that goes in and observing the one that comes out.
 */
export class ParserProviderExtension extends Extension {
  public parsed: Array<string> = [];
  public stringified: Array<UnistNode> = [];
  public transformed: Array<UnistNode> = [];

  private readonly source: string;
  private readonly tree: UnistNode;

  public constructor(tree: UnistNode, source: string) {
    super();
    this.tree = tree;
    this.source = source;
  }

  public override unifiedInitializationHook(
    processor: UnifiedProcessor,
  ): UnifiedProcessor {
    processor.parser = (document): UnistNode => {
      this.parsed.push(document);
      return this.tree;
    };
    // A transformer, so that the run phase of the pipeline is exercised too.
    // This is where downstream plugins such as remark-gfm hook in.
    processor.use(() => (tree: UnistNode): UnistNode => {
      this.transformed.push(tree);
      return tree;
    });
    processor.compiler = (tree): string => {
      this.stringified.push(tree);
      return this.source;
    };
    return processor;
  }
}
