import { Chain } from "wagmi";

const RPC_URL = process.env.REACT_APP_RPC_URL || "https://rpc.linea.build";

export const lineaMainnet = {
  id: 59144,
  name: "Linea Mainnet",
  network: "Linea Mainnet",
  nativeCurrency: {
    decimals: 18,
    name: "ETH",
    symbol: "ETH"
  },
  rpcUrls: {
    public: { http: [RPC_URL] },
    default: { http: [RPC_URL] }
  },
  blockExplorers: {
    etherscan: { name: "Lineascan", url: "https://lineascan.build/" },
    default: { name: "Lineascan", url: "https://lineascan.build/" }
  }
} as const satisfies Chain;
