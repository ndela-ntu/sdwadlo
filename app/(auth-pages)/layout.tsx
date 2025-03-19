export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 items-center justify-center p-2.5">
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center">
        <h1 className="text-eerieBlack text-5xl pb-5 italic font-black">
          SDWADLO
        </h1>
        <div className="h-screen w-full">{children}</div>
      </div>
    </div>
  );
}
