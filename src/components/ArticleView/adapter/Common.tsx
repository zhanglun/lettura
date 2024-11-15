import { wraperWithRadix } from "../ContentRender";

export interface CommonAdapterProps {
  content: string;
}

export const CommonAdapter = ({ content }: CommonAdapterProps) => {
  return <div>{wraperWithRadix(content)}</div>;
};
