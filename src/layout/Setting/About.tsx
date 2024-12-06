import { Panel } from "./Panel";

export const About = () => {
  return (
    <Panel title="About">
      <div>
        <p className="text-sm mb-3 mt-2 text-[var(--gray-11)]">Version: 0.0.1</p>
      </div>
    </Panel>
  );
};
