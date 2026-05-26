type DayDividerProps = {
  label: string;
};

export const DayDivider = ({ label }: DayDividerProps) => (
  <div className="sticky top-0 z-10 flex justify-center py-2">
    <span
      suppressHydrationWarning
      className="rounded-full bg-[#2c2c30]/90 px-3 py-1 text-xs font-medium text-[#adaeb1] backdrop-blur-sm"
    >
      {label}
    </span>
  </div>
);
