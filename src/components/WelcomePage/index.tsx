import bg from "./bg.svg";

export const WelcomePage = () => {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="w-[40%] max-w-[500px]">
        <img src={bg} className="w-full" />
      </div>
    </div>
  );
};
