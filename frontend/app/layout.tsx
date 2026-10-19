import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./accessibility.css";
import { WalletProvider } from "@/components/WalletContext";
import { Shell } from "@/components/Shell";
export const metadata:Metadata={title:"Senvara | Questions backed by evidence",description:"A public workspace for version-bound documentary software claims reviewed through GenLayer validator judgment."};
export default function RootLayout({children}:{children:ReactNode}){
  return <html lang="en"><body><WalletProvider><Shell>{children}</Shell></WalletProvider></body></html>;
}
