import { signOut } from "@/app/(site)/(auth)/actions";

export function AccountMenu({ name }: { name: string }) {
  return (
    <form action={signOut} className="mt-2 flex items-center gap-2 border-t border-sand/15 pt-2 text-xs text-sand/80">
      <span className="truncate">Signed in as {name}</span>
      <button
        type="submit"
        className="cursor-pointer rounded-full px-2 py-1 font-medium text-sand underline-offset-4 transition-colors duration-200 hover:bg-sand/10 hover:underline"
      >
        Sign out
      </button>
    </form>
  );
}
