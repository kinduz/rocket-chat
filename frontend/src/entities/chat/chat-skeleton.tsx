const SKELETON_KEYS = ['s1', 's2', 's3', 's4', 's5'];

export const ChatSkeletonItem = () => (
  <div className="flex items-center gap-3 rounded-xl px-3 py-2 sidebar-compact:justify-center">
    <div
      className="shrink-0 rounded-full bg-white/5 animate-pulse"
      style={{ width: 44, height: 44 }}
    />
    <div className="sidebar-compact:hidden min-w-0 flex-1 space-y-2">
      <div className="h-3.5 w-32 rounded bg-white/10 animate-pulse" />
      <div className="h-3 w-48 rounded bg-white/5 animate-pulse" />
    </div>
  </div>
);

type ChatListSkeletonProps = {
  count?: number;
};

export const ChatListSkeleton = ({ count = 5 }: ChatListSkeletonProps) => {
  const keys = SKELETON_KEYS.slice(0, count);
  return (
    <ul className="flex flex-col gap-1 px-2 py-2 w-full">
      {keys.map((k) => (
        <li key={k}>
          <ChatSkeletonItem />
        </li>
      ))}
    </ul>
  );
};
