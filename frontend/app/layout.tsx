import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./accessibility.css";
import { WalletProvider } from "@/components/WalletContext";
import { Shell } from "@/components/Shell";
import { CONFIGURED, CONTRACT_ADDRESS, CONTRACT_SOURCE_SHA256, CONTRACT_VERSION } from "@/lib/constants";
export const metadata:Metadata={title:"Senvara | Questions backed by evidence",description:"A public workspace for version-bound documentary software claims reviewed through GenLayer validator judgment."};
export default function RootLayout({children}:{children:ReactNode}){
  return <html lang="en"><body
    data-senvara-configured={CONFIGURED ? "true" : "false"}
    data-senvara-contract={CONFIGURED ? CONTRACT_ADDRESS : ""}
    data-senvara-contract-version={CONFIGURED ? CONTRACT_VERSION : ""}
    data-senvara-source-sha256={CONFIGURED ? CONTRACT_SOURCE_SHA256 : ""}
  ><WalletProvider><Shell>{children}</Shell></WalletProvider></body></html>;
}
