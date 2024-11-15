import { Text, Link, Heading, Blockquote } from "@radix-ui/themes";
import HTMLReactParser, { domToReact, HTMLReactParserOptions, DOMNode, attributesToProps } from "html-react-parser";

// 自定义转换函数，用于替换标签
const options: HTMLReactParserOptions = {
  replace: (node: DOMNode) => {
    //  return node;

    if (node.type === "tag") {
      if (node.name === "body") {
        return <div>{domToReact(node.children as DOMNode[], options)}</div>;
      }

      if (node.name === "p") {
        return (
          <Text as="p" size="3" my="4" style={{ letterSpacing: "0.5px" }} {...attributesToProps(node.attribs)}>
            {domToReact(node.children as DOMNode[], options)}
          </Text>
        );
      }

      if (node.name === "blockquote") {
        return (
          <Blockquote {...attributesToProps(node.attribs)}>
            {domToReact(node.children as DOMNode[], options)}
          </Blockquote>
        );
      }

      if (node.name === "h1") {
        return (
          <Heading {...attributesToProps(node.attribs)} size="8" mb="6">
            {domToReact(node.children as DOMNode[], options)}
          </Heading>
        );
      }
      if (node.name === "h2") {
        return (
          <Heading {...attributesToProps(node.attribs)} size="7" mb="5">
            {domToReact(node.children as DOMNode[], options)}
          </Heading>
        );
      }
      if (node.name === "h3") {
        return (
          <Heading {...attributesToProps(node.attribs)} size="6" mb="4">
            {domToReact(node.children as DOMNode[], options)}
          </Heading>
        );
      }

      if (node.name === "a") {
        return <Link {...attributesToProps(node.attribs)}>{domToReact(node.children as DOMNode[], options)}</Link>;
      }
    }

    return node;
  },
};

export const wraperWithRadix = (content: string) => {
  return HTMLReactParser(content, options);
};
