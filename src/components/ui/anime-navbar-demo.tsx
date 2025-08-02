import { Gift, UserPlus, User } from "lucide-react"
import { AnimeNavBar } from "./anime-navbar"

const navItems = [
  {
    name: "Rewards",
    url: "/rewards",
    icon: Gift,
  },
  {
    name: "Join Contest",
    url: "/contests",
    icon: UserPlus,
  },
  {
    name: "Profile",
    url: "/profile",
    icon: User,
  },
]

export function AnimeNavBarDemo() {
  return <AnimeNavBar items={navItems} defaultActive="Join Contest" />
}
