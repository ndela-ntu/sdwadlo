import NavLinks from "./nav-links";

export default function SideNav() {
  return (
    <div className="fixed h-full w-72 flex flex-col items-center border-r-2 border-black bg-white z-10">
      <div className="w-full flex flex-col items-center justify-center py-1">
        <h1 className="text-eerieBlack text-3xl pb-1 font-black italic">SDWADLO.CO</h1>
        <div className="flex w-full px-1">
          <NavLinks />
        </div>
      </div>
    </div>
  );
}