import DOMPurify from "dompurify";
import HTMLReactParser, {
  domToReact,
  HTMLReactParserOptions,
  DOMNode,
  attributesToProps,
} from "html-react-parser";
import { ImageLazyLoad } from "@/components/ImageLazyLoad/index";

const options: HTMLReactParserOptions = {
  replace: (node: DOMNode) => {
    if (node.type === "tag") {
      if (node.name === "body") {
        return <div>{domToReact(node.children as DOMNode[], options)}</div>;
      }

      if (["p", "blockquote", "q", "h1", "h2", "h3", "a"].includes(node.name)) {
        const Tag = node.name;
        return (
          <Tag {...attributesToProps(node.attribs)}>
            {domToReact(node.children as DOMNode[], options)}
          </Tag>
        );
      }

      if (node.name === "img") {
        const props = attributesToProps(node.attribs);
        return (
          <ImageLazyLoad
            src={props.src as string}
            alt={props.alt as string}
            className={props.className as string}
            width={props.width as number | string}
            height={props.height as number | string}
          />
        );
      }
    }

    return node;
  },
};

export const renderArticleContent = (content: string) => {
  return HTMLReactParser(DOMPurify.sanitize(content), options);
};
