import { UserButton } from "@clerk/nextjs";
import Image from "next/image";

export default function Home() {
  return (
    <div>
      This Page Can Only be Seen by Authenticated Users
      <UserButton afterSignOutUrl="/" />
    </div>
  );
}
