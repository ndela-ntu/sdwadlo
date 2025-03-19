import NavLinks from "./nav-links";

export default function SideNav() {
  return (
    <div className="w-full flex flex-col items-center justify-center py-1">
      <h1 className="text-eerieBlack text-4xl pb-1 font-black italic">SDWADLO</h1>
      <div className="flex w-full px-1"><NavLinks /></div>
    </div>
  );
}
