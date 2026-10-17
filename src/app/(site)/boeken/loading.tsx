import { BookingSkeleton } from "@/components/site/loading-skeletons";
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-[40rem] px-4 pb-10 pt-6 md:pb-20 md:pt-12">
      <BookingSkeleton />
    </div>
  );
}
